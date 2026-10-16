import { Router, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db.ts';
import { authenticate, type AuthenticatedRequest } from '../auth.ts';
import type { Notification } from '../types.ts';

import { wsManager } from '../websocket.ts';

const router = Router();

// GET notifications for current user
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const notifications = db.getNotifications(req.user!.id);
  const unreadCount = notifications.filter(n => !n.read).length;
  return res.json({ notifications, unreadCount });
});

// PUT mark single notification as read
router.put('/:id/read', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = db.markNotificationAsRead(id);
  return res.json({ success });
});

// POST mark all notifications as read
router.post('/read-all', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const updatedCount = db.markAllNotificationsAsRead(req.user!.id);
  return res.json({ updatedCount });
});

// POST test notification for live testing
router.post('/test', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const notif: Notification = {
    id: `notif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    userId: req.user!.id,
    title: '🔔 Test Real-Time Alert',
    message: `FlowSprint WebSocket notification pushed to your device at ${new Date().toLocaleTimeString()}!`,
    type: 'comment_added',
    read: false,
    createdAt: new Date().toISOString(),
  };
  const created = db.createNotification(notif);
  wsManager.broadcastToUser(req.user!.id, 'notification:new', created);
  return res.status(201).json({ notification: created });
});

export default router;
