import type { ContactRequest, MainCategory, System } from '../types';

const BASE = '/api';

// SSO stub: בשלב זה שולחים את מזהה העובד כ-header
// בעתיד יוחלף בטוקן אמיתי מה-SSO
function getAuthHeaders(): Record<string, string> {
  const employeeId = sessionStorage.getItem('employeeId') ?? 'user001';
  const displayName = sessionStorage.getItem('displayName') ?? 'ישראל ישראלי';
  return {
    'Content-Type': 'application/json',
    'x-employee-id': employeeId,
    'x-display-name': encodeURIComponent(displayName),
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  const json = await res.json() as { data: T };
  return json.data;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  const json = await res.json() as { data: T };
  return json.data;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  const json = await res.json() as { data: T };
  return json.data;
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
}

// ===== API calls =====

export const api = {
  users: {
    me: () => get('/users/me'),
  },

  mainCategories: {
    list: () => get<MainCategory[]>('/main-categories'),
    get: (id: number) => get<MainCategory>(`/main-categories/${id}`),
    create: (data: Partial<MainCategory>) => post<MainCategory>('/main-categories', data),
    update: (id: number, data: Partial<MainCategory>) => put<MainCategory>(`/main-categories/${id}`, data),
    delete: (id: number) => del(`/main-categories/${id}`),
  },

  subCategories: {
    create: (data: { name: string; description?: string; sortOrder?: number; mainCategoryId: number }) =>
      post('/sub-categories', data),
    update: (id: number, data: { name?: string; description?: string; sortOrder?: number; isActive?: boolean }) =>
      put(`/sub-categories/${id}`, data),
    delete: (id: number) => del(`/sub-categories/${id}`),
  },

  systems: {
    list: () => get<System[]>('/systems'),
    search: (q: string) => get<System[]>(`/systems/search?q=${encodeURIComponent(q)}`),
    create: (data: Partial<System>) => post<System>('/systems', data),
    update: (id: number, data: Partial<System>) => put<System>(`/systems/${id}`, data),
    delete: (id: number) => del(`/systems/${id}`),
  },

  visits: {
    recent: () => get<System[]>('/visits/recent'),
    record: (systemId: number) => post('/visits', { systemId }),
  },

  contact: {
    send: (data: ContactRequest) => post('/contact', data),
  },
};
