import { Router, Response } from 'express';
import { db } from '../db.ts';
import { authenticate, AuthenticatedRequest } from '../auth.ts';

const router = Router();

// GET comprehensive dashboard metrics for user
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const userProjects = db.getProjectsForUser(currentUserId);
  const projectIds = userProjects.map(p => p.id);

  // All tasks within user's projects
  const allTasks = db.getTasks().filter(t => projectIds.includes(t.projectId));
  const myTasks = allTasks.filter(t => t.assigneeId === currentUserId);

  const todayStr = new Date().toISOString().split('T')[0];

  const completedTasks = allTasks.filter(t => t.status === 'completed');
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');
  const reviewTasks = allTasks.filter(t => t.status === 'review');
  const todoTasks = allTasks.filter(t => t.status === 'todo');

  const overdueTasks = allTasks.filter(
    t => t.dueDate && t.dueDate < todayStr && t.status !== 'completed'
  );

  const completionRate = allTasks.length > 0
    ? Math.round((completedTasks.length / allTasks.length) * 100)
    : 0;

  // Upcoming deadlines (next 6 tasks)
  const upcomingDeadlines = allTasks
    .filter(t => t.dueDate && t.status !== 'completed')
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1))
    .slice(0, 6)
    .map(t => {
      const project = db.getProjectById(t.projectId);
      const assignee = t.assigneeId ? db.getUserById(t.assigneeId) : null;
      return {
        ...t,
        projectName: project?.name || 'Project',
        projectColor: project?.color || 'emerald',
        assigneeName: assignee?.name || 'Unassigned',
        assigneeAvatar: assignee?.avatarUrl || null,
      };
    });

  // Projects with progress overview
  const projectsSummary = userProjects.map(p => {
    const pTasks = allTasks.filter(t => t.projectId === p.id);
    const pCompleted = pTasks.filter(t => t.status === 'completed').length;
    const progress = pTasks.length > 0 ? Math.round((pCompleted / pTasks.length) * 100) : 0;
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      color: p.color,
      tag: p.tag,
      totalTasks: pTasks.length,
      completedTasks: pCompleted,
      progress,
      membersCount: p.members.length,
      updatedAt: p.updatedAt,
    };
  });

  // Recent activities
  const recentActivities = db.getActivities().filter(a => projectIds.includes(a.projectId)).slice(0, 12);

  return res.json({
    metrics: {
      totalProjects: userProjects.length,
      totalTasks: allTasks.length,
      myTasksCount: myTasks.length,
      completedTasksCount: completedTasks.length,
      inProgressTasksCount: inProgressTasks.length,
      reviewTasksCount: reviewTasks.length,
      todoTasksCount: todoTasks.length,
      pendingTasksCount: allTasks.length - completedTasks.length,
      overdueTasksCount: overdueTasks.length,
      completionRate,
    },
    priorityDistribution: {
      urgent: allTasks.filter(t => t.priority === 'urgent').length,
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length,
    },
    statusDistribution: {
      todo: todoTasks.length,
      in_progress: inProgressTasks.length,
      review: reviewTasks.length,
      completed: completedTasks.length,
    },
    upcomingDeadlines,
    projectsSummary,
    recentActivities,
  });
});

// POST reset demo data
router.post('/reset-demo', authenticate, (_req: AuthenticatedRequest, res: Response) => {
  db.resetToSeed();
  return res.json({ success: true, message: 'College demo dataset restored successfully' });
});

// GET database status (MongoDB vs Local JSON)
router.get('/db-status', (_req, res: Response) => {
  const info = db.getDatabaseInfo();
  return res.json(info);
});

export default router;
