import {
  DailyAgendaResponse,
  WeeklyAgendaResponse,
  MonthlyAgendaResponse,
  Task,
  DailyPriority,
  ScheduleEvent,
  DailyNote,
  Note,
  WeeklyPlan,
  AppSettings,
  AuthUser,
} from '../types';

const API_BASE = '/api';
const TOKEN_KEY = 'agenda_auth_token';

export function getToken(): string | null {
  return (
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  );
}

export function setToken(token: string, remember = true) {
  clearToken();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    if (res.status === 401 && !url.startsWith('/auth/login')) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('agenda:unauthorized'));
      }
    }
    throw new Error(errorBody.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Authentication
  login: (data: { email: string; password: string }) =>
    fetchJson<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCurrentUser: () =>
    fetchJson<{ user: AuthUser }>('/auth/me'),
  logout: () =>
    fetchJson<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  // Agenda
  getDailyAgenda: (date: string) =>
    fetchJson<DailyAgendaResponse>(`/daily-agenda/${date}`),
  getWeeklyAgenda: (date: string) =>
    fetchJson<WeeklyAgendaResponse>(`/weekly-agenda/${date}`),
  getMonthlyAgenda: (year: number, month: number) =>
    fetchJson<MonthlyAgendaResponse>(`/monthly-agenda/${year}/${month}`),

  // Tasks
  getTasks: (date?: string) =>
    fetchJson<Task[]>(`/tasks${date ? `?date=${date}` : ''}`),
  createTask: (data: Partial<Task>) =>
    fetchJson<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: Partial<Task>) =>
    fetchJson<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  moveTask: (id: string, targetDate: string) =>
    fetchJson<Task>(`/tasks/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ targetDate }),
    }),
  deleteTask: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  // Priorities
  upsertPriority: (data: Partial<DailyPriority>) =>
    fetchJson<DailyPriority>('/priorities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePriority: (id: string, data: Partial<DailyPriority>) =>
    fetchJson<DailyPriority>(`/priorities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePriority: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/priorities/${id}`, {
      method: 'DELETE',
    }),

  // Schedule Events
  createEvent: (data: Partial<ScheduleEvent>) =>
    fetchJson<ScheduleEvent>('/schedule-events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEvent: (id: string, data: Partial<ScheduleEvent>) =>
    fetchJson<ScheduleEvent>(`/schedule-events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEvent: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/schedule-events/${id}`, {
      method: 'DELETE',
    }),

  // Daily Notes
  getDailyNote: (date: string) =>
    fetchJson<DailyNote>(`/daily-notes/${date}`),
  saveDailyNote: (
    date: string,
    data: {
      content: string;
      noteType?: 'text' | 'code';
      quote?: string | null;
      quoteAuthor?: string | null;
    }
  ) =>
    fetchJson<DailyNote>(`/daily-notes/${date}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Weekly Plan
  saveWeeklyPlan: (weekStartDate: string, data: Partial<WeeklyPlan>) =>
    fetchJson<WeeklyPlan>(`/weekly-plan/${weekStartDate}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Personal Notes
  getNotes: (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    return fetchJson<Note[]>(`/notes?${params.toString()}`);
  },
  createNote: (data: Partial<Note>) =>
    fetchJson<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateNote: (id: string, data: Partial<Note>) =>
    fetchJson<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteNote: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/notes/${id}`, {
      method: 'DELETE',
    }),

  // Monthly Plan
  saveMonthlyPlan: (
    year: number,
    month: number,
    data: { intentions?: string; notes?: string }
  ) =>
    fetchJson<import('../types').MonthlyPlan>(`/monthly-plan/${year}/${month}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Settings
  getSettings: () => fetchJson<AppSettings>('/settings'),
  updateSettings: (data: Partial<AppSettings>) =>
    fetchJson<AppSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Backup & Restore
  exportBackupUrl: () => `${API_BASE}/backup/export`,
  importBackup: (backupData: any) =>
    fetchJson<{ success: boolean; message: string }>('/backup/import', {
      method: 'POST',
      body: JSON.stringify(backupData),
    }),

  // Voice Notes
  getVoiceNotes: (targetType: 'daily' | 'weekly' | 'note', targetId: string) =>
    fetchJson<import('../types').VoiceNote[]>(
      `/voice-notes?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`
    ),
  createVoiceNote: (data: {
    title?: string | null;
    audioData: string;
    duration: number;
    targetType: 'daily' | 'weekly' | 'note';
    targetId: string;
  }) =>
    fetchJson<import('../types').VoiceNote>('/voice-notes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteVoiceNote: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/voice-notes/${id}`, {
      method: 'DELETE',
    }),

  // Image Attachments
  getImages: (targetType: 'daily' | 'weekly' | 'note', targetId: string) =>
    fetchJson<import('../types').ImageAttachment[]>(
      `/images?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`
    ),
  createImage: (data: {
    caption?: string | null;
    imageData: string;
    targetType: 'daily' | 'weekly' | 'note';
    targetId: string;
  }) =>
    fetchJson<import('../types').ImageAttachment>('/images', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteImage: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/images/${id}`, {
      method: 'DELETE',
    }),

  // Categories
  getCategories: () => fetchJson<import('../types').Category[]>('/categories'),
  createCategory: (data: { name: string; color?: string }) =>
    fetchJson<import('../types').Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Global Agenda Search
  searchAgenda: (params: {
    q?: string;
    scope?: 'all' | 'daily' | 'monthly' | 'notes';
    dayName?: string;
    month?: string;
  }) => {
    const sp = new URLSearchParams();
    if (params.q) sp.append('q', params.q);
    if (params.scope && params.scope !== 'all') sp.append('scope', params.scope);
    if (params.dayName && params.dayName !== 'all') sp.append('dayName', params.dayName);
    if (params.month && params.month !== 'all') sp.append('month', params.month);
    return fetchJson<{ results: import('../types').SearchResultItem[]; total: number }>(
      `/search?${sp.toString()}`
    );
  },

  // Whiteboards
  getWhiteboards: () => fetchJson<import('../types').Whiteboard[]>('/whiteboards'),
  createWhiteboard: (data: Partial<import('../types').Whiteboard>) =>
    fetchJson<import('../types').Whiteboard>('/whiteboards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateWhiteboard: (id: string, data: Partial<import('../types').Whiteboard>) =>
    fetchJson<import('../types').Whiteboard>(`/whiteboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteWhiteboard: (id: string) =>
    fetchJson<{ success: boolean; id: string }>(`/whiteboards/${id}`, {
      method: 'DELETE',
    }),
  updateCategory: (id: string, data: { name?: string; color?: string }) =>
    fetchJson<import('../types').Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    fetchJson<{ success: boolean; id: string; name: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),
};
