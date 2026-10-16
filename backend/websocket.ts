import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from './auth.ts';
import { db } from './db.ts';

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  projectId?: string;
  isAlive: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<ClientConnection> = new Set();

  public init(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const client: ClientConnection = {
        ws,
        isAlive: true,
      };
      this.clients.add(client);

      // Extract token from query string if available
      try {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        const token = url.searchParams.get('token');
        if (token) {
          const userId = verifyToken(token);
          if (userId) {
            client.userId = userId;
          }
        }
      } catch {
        // ignore
      }

      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(client, data);
        } catch (e) {
          console.error('Invalid WS payload:', e);
        }
      });

      ws.on('close', () => {
        const oldProjectId = client.projectId;
        this.clients.delete(client);
        if (oldProjectId) {
          this.broadcastPresence(oldProjectId);
        }
      });

      ws.on('error', (err) => {
        console.error('WS client error:', err);
      });

      // Send initial connection ACK
      ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
    });

    // Heartbeat ping interval
    const interval = setInterval(() => {
      this.clients.forEach(client => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });

    console.log('✓ FlowSprint WebSocket Server initialized on /ws');
  }

  private handleClientMessage(client: ClientConnection, data: any) {
    switch (data.type) {
      case 'auth': {
        if (data.token) {
          const userId = verifyToken(data.token);
          if (userId) {
            client.userId = userId;
            client.ws.send(JSON.stringify({ type: 'auth:success', userId }));
          }
        }
        break;
      }
      case 'join:project': {
        const previousProject = client.projectId;
        client.projectId = data.projectId;
        if (previousProject && previousProject !== data.projectId) {
          this.broadcastPresence(previousProject);
        }
        this.broadcastPresence(data.projectId);
        break;
      }
      case 'leave:project': {
        const oldProj = client.projectId;
        client.projectId = undefined;
        if (oldProj) {
          this.broadcastPresence(oldProj);
        }
        break;
      }
    }
  }

  public broadcastPresence(projectId: string) {
    const activeUserIds = new Set<string>();
    this.clients.forEach(c => {
      if (c.projectId === projectId && c.userId) {
        activeUserIds.add(c.userId);
      }
    });

    const activeUsers = Array.from(activeUserIds)
      .map(uid => db.getUserById(uid))
      .filter(Boolean)
      .map(u => ({
        id: u!.id,
        name: u!.name,
        avatarUrl: u!.avatarUrl,
        title: u!.title,
      }));

    this.broadcastToProject(projectId, 'presence:update', {
      projectId,
      users: activeUsers,
    });
  }

  public broadcastToProject(projectId: string, event: string, payload: any) {
    const msg = JSON.stringify({ type: event, data: payload, projectId });
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN && client.projectId === projectId) {
        client.ws.send(msg);
      }
    });
  }

  public broadcastToUser(userId: string, event: string, payload: any) {
    const msg = JSON.stringify({ type: event, data: payload, userId });
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN && client.userId === userId) {
        client.ws.send(msg);
      }
    });
  }

  public broadcastGlobal(event: string, payload: any) {
    const msg = JSON.stringify({ type: event, data: payload });
    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
      }
    });
  }
}

export const wsManager = new WebSocketManager();
