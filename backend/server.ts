import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './app.ts';
import { wsManager } from './websocket.ts';
import { connectMongoDB } from './mongodb.ts';
import { db } from './db.ts';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export async function startServer() {
  const app = createExpressApp();
  const httpServer = http.createServer(app);
  const isProduction = process.env.NODE_ENV === 'production';

  // Attach WebSocket server on /ws
  wsManager.init(httpServer);

  // Connect to MongoDB if MONGODB_URI is provided in .env
  try {
    const mongoConnected = await connectMongoDB();
    if (mongoConnected) {
      await db.initMongoSync();
    }
  } catch (err) {
    console.error('MongoDB initial connection attempt error:', err);
  }

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ FlowSprint Full-Stack Server & WebSockets active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
