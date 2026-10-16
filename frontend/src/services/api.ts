import {
  User,
  Project,
  Task,
  Comment,
  Notification,
  DashboardData,
  TaskStatus,
  ProjectRole,
} from '../types.ts';

const TOKEN_KEY = 'flowsprint_auth_token';

export const authStorage = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clearToken: (): void => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
      const res = await request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      authStorage.setToken(res.token);
      return res;
    },

    register: async (data: {
      name: string;
      email: string;
      password: string;
      department?: string;
      title?: string;
    }): Promise<{ user: User; token: string }> => {
      const res = await request<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      authStorage.setToken(res.token);
      return res;
    },

    me: async (): Promise<{ user: User }> => {
      return request<{ user: User }>('/api/auth/me');
    },

    logout: async (): Promise<void> => {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } finally {
        authStorage.clearToken();
      }
    },

    getUsers: async (): Promise<{ users: User[] }> => {
      return request<{ users: User[] }>('/api/auth/users');
    },

    demoSwitch: async (userId: string): Promise<{ user: User; token: string }> => {
      const res = await request<{ user: User; token: string }>('/api/auth/demo-switch', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      authStorage.setToken(res.token);
      return res;
    },
  },

  // Projects
  projects: {
    list: async (): Promise<{ projects: Project[] }> => {
      return request<{ projects: Project[] }>('/api/projects');
    },

    get: async (id: string): Promise<{ project: Project }> => {
      return request<{ project: Project }>(`/api/projects/${id}`);
    },

    create: async (data: {
      name: string;
      description?: string;
      color?: string;
      tag?: string;
      initialMemberIds?: string[];
    }): Promise<{ project: Project }> => {
      return request<{ project: Project }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: string,
      updates: Partial<Pick<Project, 'name' | 'description' | 'color' | 'tag'>>
    ): Promise<{ project: Project }> => {
      return request<{ project: Project }>(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/projects/${id}`, {
        method: 'DELETE',
      });
    },

    addMember: async (
      projectId: string,
      userId: string,
      role: ProjectRole = 'member'
    ): Promise<{ project: Project }> => {
      return request<{ project: Project }>(`/api/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId, role }),
      });
    },

    removeMember: async (projectId: string, userId: string): Promise<{ project: Project }> => {
      return request<{ project: Project }>(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
      });
    },
  },

  // Tasks
  tasks: {
    list: async (params?: { projectId?: string; assignedToMe?: boolean }): Promise<{ tasks: Task[] }> => {
      const query = new URLSearchParams();
      if (params?.projectId) query.set('projectId', params.projectId);
      if (params?.assignedToMe) query.set('assignedToMe', 'true');
      const qs = query.toString();
      return request<{ tasks: Task[] }>(`/api/tasks${qs ? `?${qs}` : ''}`);
    },

    get: async (id: string): Promise<{ task: Task }> => {
      return request<{ task: Task }>(`/api/tasks/${id}`);
    },

    create: async (data: {
      projectId: string;
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: string;
      assigneeId?: string | null;
      dueDate?: string | null;
      tags?: string[];
    }): Promise<{ task: Task }> => {
      return request<{ task: Task }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, updates: Partial<Task>): Promise<{ task: Task }> => {
      return request<{ task: Task }>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    move: async (id: string, targetStatus: TaskStatus, newIndex: number): Promise<{ task: Task }> => {
      return request<{ task: Task }>(`/api/tasks/${id}/move`, {
        method: 'POST',
        body: JSON.stringify({ targetStatus, newIndex }),
      });
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Comments
  comments: {
    list: async (taskId: string): Promise<{ comments: Comment[] }> => {
      return request<{ comments: Comment[] }>(`/api/comments?taskId=${taskId}`);
    },

    create: async (taskId: string, content: string): Promise<{ comment: Comment }> => {
      return request<{ comment: Comment }>('/api/comments', {
        method: 'POST',
        body: JSON.stringify({ taskId, content }),
      });
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/comments/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Notifications
  notifications: {
    list: async (): Promise<{ notifications: Notification[]; unreadCount: number }> => {
      return request<{ notifications: Notification[]; unreadCount: number }>('/api/notifications');
    },

    markRead: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });
    },

    markAllRead: async (): Promise<{ updatedCount: number }> => {
      return request<{ updatedCount: number }>('/api/notifications/read-all', {
        method: 'POST',
      });
    },

    testPing: async (): Promise<{ notification: Notification }> => {
      return request<{ notification: Notification }>('/api/notifications/test', {
        method: 'POST',
      });
    },
  },

  // Dashboard & Demo System
  dashboard: {
    get: async (): Promise<DashboardData> => {
      return request<DashboardData>('/api/dashboard');
    },

    resetDemo: async (): Promise<{ success: boolean; message: string }> => {
      return request<{ success: boolean; message: string }>('/api/dashboard/reset-demo', {
        method: 'POST',
      });
    },

    getDbStatus: async (): Promise<{
      type: 'mongodb' | 'file';
      isMongoConnected: boolean;
      uriConfigured: boolean;
      dbName?: string;
      host?: string;
      error?: string;
      localFilePath: string;
    }> => {
      return request('/api/system/db-status');
    },
  },
};
