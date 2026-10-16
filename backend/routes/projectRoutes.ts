import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db.ts';
import { authenticate, type AuthenticatedRequest } from '../auth.ts';
import type { Project, ProjectRole, Notification } from '../types.ts';

const router = Router();

// GET all projects accessible by current user
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const projects = db.getProjectsForUser(currentUserId);
  return res.json({ projects });
});

// GET single project by ID (with enriched member details)
router.get('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Enrich members with user details
  const enrichedMembers = project.members.map(m => {
    const user = db.getUserById(m.userId);
    return {
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      name: user ? user.name : 'Unknown User',
      email: user ? user.email : '',
      avatarUrl: user ? user.avatarUrl : '',
      department: user?.department || '',
      title: user?.title || '',
    };
  });

  return res.json({
    project: {
      ...project,
      enrichedMembers,
    },
  });
});

// POST create new project
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { name, description, color, tag, initialMemberIds } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const currentUserId = req.user!.id;
  const projectId = `proj_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const members: Array<{ userId: string; role: ProjectRole; joinedAt: string }> = [
    {
      userId: currentUserId,
      role: 'lead',
      joinedAt: new Date().toISOString(),
    },
  ];

  // Add initial members if provided
  if (Array.isArray(initialMemberIds)) {
    initialMemberIds.forEach(uid => {
      if (uid !== currentUserId && db.getUserById(uid)) {
        members.push({
          userId: uid,
          role: 'member',
          joinedAt: new Date().toISOString(),
        });
      }
    });
  }

  const project: Project = {
    id: projectId,
    name: name.trim(),
    description: description?.trim() || '',
    ownerId: currentUserId,
    color: color || 'emerald',
    tag: tag?.trim().toUpperCase() || name.substring(0, 4).toUpperCase(),
    members,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const created = db.createProject(project);

  // Log activity
  db.logActivity({
    id: `act_${Date.now()}`,
    projectId,
    userId: currentUserId,
    userName: req.user!.name,
    action: 'created project',
    targetTitle: project.name,
    createdAt: new Date().toISOString(),
  });

  // Notify invited members
  if (Array.isArray(initialMemberIds)) {
    initialMemberIds.forEach(uid => {
      if (uid !== currentUserId) {
        const notif: Notification = {
          id: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
          userId: uid,
          title: 'Project Invitation',
          message: `${req.user!.name} added you to project "${project.name}"`,
          type: 'project_invite',
          read: false,
          link: `/project/${project.id}`,
          createdAt: new Date().toISOString(),
        };
        db.createNotification(notif);
      }
    });
  }

  return res.status(201).json({ project: created });
});

// PUT update project
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { name, description, color, tag } = req.body;
  const updates: Partial<Project> = {};
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined) updates.description = description.trim();
  if (color !== undefined) updates.color = color;
  if (tag !== undefined) updates.tag = tag.trim().toUpperCase();

  const updated = db.updateProject(id, updates);

  db.logActivity({
    id: `act_${Date.now()}`,
    projectId: id,
    userId: req.user!.id,
    userName: req.user!.name,
    action: 'updated project details',
    targetTitle: updated?.name || project.name,
    createdAt: new Date().toISOString(),
  });

  return res.json({ project: updated });
});

// DELETE project
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const success = db.deleteProject(id);
  return res.json({ success, message: 'Project and associated tasks deleted' });
});

// POST invite/add member to project
router.post('/:id/members', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { userId, role } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const targetUser = db.getUserById(userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User does not exist' });
  }

  const updated = db.addProjectMember(id, {
    userId,
    role: role || 'member',
  });

  // Notify user
  db.createNotification({
    id: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    userId,
    title: 'Added to Project',
    message: `${req.user!.name} added you to "${project.name}" as ${role || 'member'}`,
    type: 'project_invite',
    read: false,
    link: `/project/${project.id}`,
    createdAt: new Date().toISOString(),
  });

  db.logActivity({
    id: `act_${Date.now()}`,
    projectId: id,
    userId: req.user!.id,
    userName: req.user!.name,
    action: `invited ${targetUser.name} to`,
    targetTitle: project.name,
    createdAt: new Date().toISOString(),
  });

  return res.json({ project: updated });
});

// DELETE remove member
router.delete('/:id/members/:userId', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id, userId } = req.params;
  const project = db.getProjectById(id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (project.ownerId === userId) {
    return res.status(400).json({ error: 'Cannot remove project owner' });
  }

  const updated = db.removeProjectMember(id, userId);
  return res.json({ project: updated });
});

export default router;
