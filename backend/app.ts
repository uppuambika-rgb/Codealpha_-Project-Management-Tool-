import express from 'express';
import authRoutes from './routes/authRoutes.ts';
import projectRoutes from './routes/projectRoutes.ts';
import taskRoutes from './routes/taskRoutes.ts';
import commentRoutes from './routes/commentRoutes.ts';
import notificationRoutes from './routes/notificationRoutes.ts';
import dashboardRoutes from './routes/dashboardRoutes.ts';

export function createExpressApp() {
  const app = express();

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'FlowSprint Project Management API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API routers
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/system', dashboardRoutes);

  // Global API error handler
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled API error:', err);
    res.status(500).json({ error: err?.message || 'Internal server error' });
  });

  return app;
}
