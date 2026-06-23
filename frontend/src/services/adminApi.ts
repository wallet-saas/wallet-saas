/**
 * Stamply — API Admin
 * 
 * Appels API pour le panel d'administration.
 * Utilise le header Authorization Bearer <token> pour l'authentification.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('stamply_admin_token');
}

function adminHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...adminHeaders(), ...(options.headers as Record<string, string> || {}) },
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body?.error || body?.message || 'Erreur serveur');
  }

  if (body && typeof body === 'object' && body.success === true && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  commerçants: { total: number; actifs: number; inactifs: number };
  cartes: number;
  visites_30j: number;
  boutiques: number;
}

export interface AdminCommercant {
  id: string;
  email: string;
  nom_enseigne: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  abonnement_statut?: string;
  stripe_customer_id?: string;
  wallet_class_configured?: boolean;
  created_at: string;
  stats?: { boutiques: number; cartes: number; visites_30j: number };
}

export interface AdminCommercantsList {
  commerçants: AdminCommercant[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminFeedback {
  id: string;
  note: number;
  commentaire?: string;
  created_at: string;
  commercant_id: string;
  commercants?: { nom_enseigne: string };
}

export interface AdminFeedbacksList {
  feedbacks: AdminFeedback[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminLog {
  id: string;
  action: string;
  target_id?: string;
  details?: any;
  created_at: string;
}

export interface AdminLogsList {
  logs: AdminLog[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export const adminApi = {
  login: (email: string, password: string) =>
    fetch(`${API_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(r => r.json()),

  stats: () => adminRequest<AdminStats>('/api/admin/stats'),

  listCommerçants: (params?: { page?: number; limit?: number; search?: string; statut?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return adminRequest<AdminCommercantsList>(`/api/admin/commercants${q ? '?' + q : ''}`);
  },
  getCommercant: (id: string) => adminRequest<AdminCommercant>(`/api/admin/commercants/${id}`),

  resetPassword: (id: string, password: string) =>
    adminRequest<{ message: string }>(`/api/admin/commercants/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  suspendreCommercant: (id: string) =>
    adminRequest<{ message: string }>(`/api/admin/commercants/${id}/suspendre`, { method: 'POST' }),
  reactiverCommercant: (id: string) =>
    adminRequest<{ message: string }>(`/api/admin/commercants/${id}/reactiver`, { method: 'POST' }),
  supprimerCommercant: (id: string) =>
    adminRequest<{ message: string }>(`/api/admin/commercants/${id}`, { method: 'DELETE' }),

  feedbacks: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return adminRequest<AdminFeedbacksList>(`/api/admin/feedbacks${q ? '?' + q : ''}`);
  },

  logs: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return adminRequest<AdminLogsList>(`/api/admin/logs${q ? '?' + q : ''}`);
  },
};
