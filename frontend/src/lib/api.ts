import type {
  ContactRequest, MainCategory, SubCategory, System,
  Video, CreateVideoDto, UpdateVideoDto,
  UploadVideoResponse, UploadThumbnailResponse,
  SystemNotification,
} from '../types';

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

/** Headers without Content-Type – for multipart/form-data uploads */
function getUploadHeaders(): Record<string, string> {
  const employeeId = sessionStorage.getItem('employeeId') ?? 'user001';
  const displayName = sessionStorage.getItem('displayName') ?? 'ישראל ישראלי';
  return {
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
      post<SubCategory>('/sub-categories', data),
    update: (id: number, data: { name?: string; description?: string; sortOrder?: number; isActive?: boolean }) =>
      put<SubCategory>(`/sub-categories/${id}`, data),
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

  // ===== Notifications =====
  notifications: {
    list: () => get<SystemNotification[]>('/notifications'),
    create: (data: { title: string; message: string }) => post<SystemNotification>('/notifications', data),
    delete: (id: number) => del(`/notifications/${id}`),
  },

  // ===== Videos =====
  videos: {
    /** Public – active videos only */
    list: () => get<Video[]>('/videos'),
    /** Admin/contentAdmin – all videos including inactive */
    listAll: () => get<Video[]>('/videos/all'),
    get: (id: number) => get<Video>(`/videos/${id}`),
    /** Create a DB record after file upload */
    create: (data: CreateVideoDto) => post<Video>('/videos', data),
    update: (id: number, data: UpdateVideoDto) => put<Video>(`/videos/${id}`, data),
    delete: (id: number) => del(`/videos/${id}`),
  },

  // ===== File uploads with progress =====
  uploads: {
    /**
     * Upload a video file with progress reporting.
     * onProgress(0–100) is called as data uploads.
     */
    video: (
      file: File,
      onProgress?: (pct: number) => void,
    ): Promise<UploadVideoResponse> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const headers = getUploadHeaders();

        xhr.open('POST', `${BASE}/uploads/video`);
        Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const json = JSON.parse(xhr.responseText) as { data: UploadVideoResponse };
            resolve(json.data);
          } else {
            let msg = `Upload failed: ${xhr.status}`;
            try {
              const err = JSON.parse(xhr.responseText) as { message?: string };
              if (err.message) msg = err.message;
            } catch { /* ignore */ }
            reject(new Error(msg));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        const form = new FormData();
        form.append('file', file);
        xhr.send(form);
      });
    },

    /**
     * Upload a thumbnail image.
     */
    thumbnail: async (file: File): Promise<UploadThumbnailResponse> => {
      const form = new FormData();
      form.append('file', file);
      const headers = getUploadHeaders();
      const res = await fetch(`${BASE}/uploads/thumbnail`, {
        method: 'POST',
        headers,
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(err.message ?? `Thumbnail upload failed: ${res.status}`);
      }
      const json = await res.json() as { data: UploadThumbnailResponse };
      return json.data;
    },

    deleteVideo: (fileName: string) => del(`/uploads/video/${encodeURIComponent(fileName)}`),
    deleteThumbnail: (fileName: string) => del(`/uploads/thumbnail/${encodeURIComponent(fileName)}`),
  },
};
