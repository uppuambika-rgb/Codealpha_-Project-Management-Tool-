import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db.ts';
import { authenticate, AuthenticatedRequest } from '../auth.ts';
import { Comment, Notification } from '../types.ts';
import { wsManager } from '../websocket.ts';

const router = Router();

// GET comments for task
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.query;
  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' });
  }

  const comments = db.getComments(taskId as string);
  return res.json({ comments });
});

// POST add comment
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { taskId, content } = req.body;
  if (!taskId || !content || !content.trim()) {
    return res.status(400).json({ error: 'taskId and comment content are required' });
  }

  const task = db.getTaskById(taskId);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const currentUser = req.user!;
  const commentId = `comm_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const comment: Comment = {
    id: commentId,
    taskId,
    projectId: task.projectId,
    userId: currentUser.id,
    userName: currentUser.name,
    userAvatar: currentUser.avatarUrl,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  const created = db.createComment(comment);

  // Broadcast comment to project members in real time
  wsManager.broadcastToProject(task.projectId, 'comment:added', {
    taskId,
    comment: created,
  });

  // Notify assignee or creator if different from commenter
  const recipients = new Set<string>();
  if (task.assigneeId && task.assigneeId !== currentUser.id) {
    recipients.add(task.assigneeId);
  }
  if (task.creatorId && task.creatorId !== currentUser.id) {
    recipients.add(task.creatorId);
  }

  recipients.forEach(userId => {
    const notif: Notification = {
      id: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      title: 'New Comment',
      message: `${currentUser.name} commented on "${task.title}": "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
      type: 'comment_added',
      read: false,
      link: `/project/${task.projectId}?task=${task.id}`,
      createdAt: new Date().toISOString(),
    };
    db.createNotification(notif);
    wsManager.broadcastToUser(userId, 'notification:new', notif);
  });

  return res.status(201).json({ comment: created });
});

// DELETE comment
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const comment = db.getCommentById(id);
  const projectId = comment?.projectId;
  const taskId = comment?.taskId;

  const success = db.deleteComment(id);
  if (projectId && taskId) {
    wsManager.broadcastToProject(projectId, 'comment:deleted', { commentId: id, taskId });
  }

  return res.json({ success });
});

export default router;
