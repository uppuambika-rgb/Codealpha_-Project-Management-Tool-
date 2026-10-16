import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db.ts';
import { authenticate, type AuthenticatedRequest } from '../auth.ts';
import type { Task, TaskPriority, TaskStatus, Notification } from '../types.ts';
import { wsManager } from '../websocket.ts';

const router = Router();

// GET tasks - filter by projectId or assignedToMe
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { projectId, assignedToMe } = req.query;
  const currentUserId = req.user!.id;

  let tasks: Task[] = [];
  if (projectId) {
    tasks = db.getTasksByProject(projectId as string);
  } else if (assignedToMe === 'true') {
    tasks = db.getTasksForUser(currentUserId);
  } else {
    // Return all accessible project tasks
    const userProjects = db.getProjectsForUser(currentUserId).map(p => p.id);
    tasks = db.getTasks().filter(t => userProjects.includes(t.projectId));
  }

  // Enrich tasks with assignee and project info
  const enrichedTasks = tasks.map(t => {
    const assignee = t.assigneeId ? db.getUserById(t.assigneeId) : null;
    const project = db.getProjectById(t.projectId);
    const commentsCount = db.getComments(t.id).length;
    return {
      ...t,
      assignee: assignee
        ? {
            id: assignee.id,
            name: assignee.name,
            email: assignee.email,
            avatarUrl: assignee.avatarUrl,
            department: assignee.department,
          }
        : null,
      projectName: project?.name || 'Unknown Project',
      projectColor: project?.color || 'emerald',
      commentsCount,
    };
  });

  return res.json({ tasks: enrichedTasks });
});

// GET single task by ID
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const task = db.getTaskById(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const assignee = task.assigneeId ? db.getUserById(task.assigneeId) : null;
  const creator = db.getUserById(task.creatorId);
  const project = db.getProjectById(task.projectId);
  const comments = db.getComments(task.id);

  return res.json({
    task: {
      ...task,
      assignee: assignee
        ? {
            id: assignee.id,
            name: assignee.name,
            email: assignee.email,
            avatarUrl: assignee.avatarUrl,
          }
        : null,
      creator: creator
        ? {
            id: creator.id,
            name: creator.name,
            avatarUrl: creator.avatarUrl,
          }
        : null,
      projectName: project?.name || '',
      comments,
    },
  });
});

// POST create task
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { projectId, title, description, status, priority, assigneeId, dueDate, tags } = req.body;
  if (!projectId || !title || !title.trim()) {
    return res.status(400).json({ error: 'Project ID and task title are required' });
  }

  const project = db.getProjectById(projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const taskId = `task_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const currentUserId = req.user!.id;

  const newTask: Task = {
    id: taskId,
    projectId,
    title: title.trim(),
    description: description?.trim() || '',
    status: (status as TaskStatus) || 'todo',
    priority: (priority as TaskPriority) || 'medium',
    assigneeId: assigneeId || null,
    creatorId: currentUserId,
    dueDate: dueDate || null,
    order: 0,
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = db.createTask(newTask);

  // Notify assignee if assigned to someone else
  if (assigneeId && assigneeId !== currentUserId) {
    const notif: Notification = {
      id: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId: assigneeId,
      title: 'New Task Assigned',
      message: `${req.user!.name} assigned you "${newTask.title}" in ${project.name}`,
      type: 'task_assigned',
      read: false,
      link: `/project/${projectId}?task=${taskId}`,
      createdAt: new Date().toISOString(),
    };
    db.createNotification(notif);
    wsManager.broadcastToUser(assigneeId, 'notification:new', notif);
  }

  // Log activity
  db.logActivity({
    id: `act_${Date.now()}`,
    projectId,
    userId: currentUserId,
    userName: req.user!.name,
    action: 'created task',
    targetTitle: newTask.title,
    createdAt: new Date().toISOString(),
  });

  // Enrich for broadcast
  const assignee = created.assigneeId ? db.getUserById(created.assigneeId) : null;
  const enrichedTask = {
    ...created,
    assignee: assignee
      ? {
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
          avatarUrl: assignee.avatarUrl,
        }
      : null,
    projectName: project.name,
    commentsCount: 0,
  };

  // Broadcast to all team members viewing this project
  wsManager.broadcastToProject(projectId, 'task:created', { task: enrichedTask });
  wsManager.broadcastGlobal('dashboard:refresh', {});

  return res.status(201).json({ task: created });
});

// PUT update task
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const task = db.getTaskById(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, status, priority, assigneeId, dueDate, tags } = req.body;
  const updates: Partial<Task> = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description.trim();
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (assigneeId !== undefined) updates.assigneeId = assigneeId || null;
  if (dueDate !== undefined) updates.dueDate = dueDate || null;
  if (tags !== undefined) updates.tags = tags;

  const previousAssignee = task.assigneeId;
  const previousStatus = task.status;

  const updated = db.updateTask(id, updates);
  if (!updated) {
    return res.status(500).json({ error: 'Failed to update task' });
  }

  const currentUserId = req.user!.id;
  const project = db.getProjectById(task.projectId);

  // Notify on assignee change
  if (updates.assigneeId && updates.assigneeId !== previousAssignee && updates.assigneeId !== currentUserId) {
    const notif: Notification = {
      id: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId: updates.assigneeId,
      title: 'Task Assigned',
      message: `${req.user!.name} assigned you "${updated.title}" in ${project?.name || 'Project'}`,
      type: 'task_assigned',
      read: false,
      link: `/project/${task.projectId}?task=${task.id}`,
      createdAt: new Date().toISOString(),
    };
    db.createNotification(notif);
    wsManager.broadcastToUser(updates.assigneeId, 'notification:new', notif);
  }

  // Notify on status change
  if (updates.status && updates.status !== previousStatus) {
    const notifyUser = task.creatorId !== currentUserId ? task.creatorId : (task.assigneeId !== currentUserId ? task.assigneeId : null);
    if (notifyUser) {
      const notif: Notification = {
        id: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        userId: notifyUser,
        title: 'Task Status Updated',
        message: `${req.user!.name} updated "${updated.title}" to ${updates.status.replace('_', ' ')}`,
        type: 'status_changed',
        read: false,
        link: `/project/${task.projectId}?task=${task.id}`,
        createdAt: new Date().toISOString(),
      };
      db.createNotification(notif);
      wsManager.broadcastToUser(notifyUser, 'notification:new', notif);
    }

    db.logActivity({
      id: `act_${Date.now()}`,
      projectId: task.projectId,
      userId: currentUserId,
      userName: req.user!.name,
      action: `moved to ${updates.status.replace('_', ' ')}`,
      targetTitle: updated.title,
      createdAt: new Date().toISOString(),
    });
  }

  // Enrich for broadcast
  const assignee = updated.assigneeId ? db.getUserById(updated.assigneeId) : null;
  const enrichedTask = {
    ...updated,
    assignee: assignee
      ? {
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
          avatarUrl: assignee.avatarUrl,
        }
      : null,
    projectName: project?.name || '',
    commentsCount: db.getComments(updated.id).length,
  };

  // Broadcast to all team members viewing this project
  wsManager.broadcastToProject(task.projectId, 'task:updated', { task: enrichedTask });
  wsManager.broadcastGlobal('dashboard:refresh', {});

  return res.json({ task: updated });
});

// POST move task (Drag & Drop support with real-time broadcast)
router.post('/:id/move', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { targetStatus, newIndex } = req.body;

  if (!targetStatus || typeof newIndex !== 'number') {
    return res.status(400).json({ error: 'targetStatus and numeric newIndex are required' });
  }

  const task = db.getTaskById(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const oldStatus = task.status;
  const reordered = db.reorderTask(id, targetStatus as TaskStatus, newIndex);

  if (oldStatus !== targetStatus) {
    db.logActivity({
      id: `act_${Date.now()}`,
      projectId: task.projectId,
      userId: req.user!.id,
      userName: req.user!.name,
      action: `moved to ${targetStatus.replace('_', ' ')}`,
      targetTitle: task.title,
      createdAt: new Date().toISOString(),
    });
  }

  // Broadcast to other collaborators on this project board
  wsManager.broadcastToProject(task.projectId, 'task:moved', {
    taskId: id,
    targetStatus,
    newIndex,
    task: reordered,
    senderId: req.user!.id,
  });
  wsManager.broadcastGlobal('dashboard:refresh', {});

  return res.json({ task: reordered });
});

// DELETE task
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const task = db.getTaskById(id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const projectId = task.projectId;
  const success = db.deleteTask(id);

  db.logActivity({
    id: `act_${Date.now()}`,
    projectId,
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'deleted task',
    targetTitle: task.title,
    createdAt: new Date().toISOString(),
  });

  // Broadcast deletion
  wsManager.broadcastToProject(projectId, 'task:deleted', { taskId: id });
  wsManager.broadcastGlobal('dashboard:refresh', {});

  return res.json({ success, message: 'Task deleted successfully' });
});

export default router;
