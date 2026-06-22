/**
 * Stamply — API Admin
 * 
 * Appels API pour le panel d'administration.
 * Utilise le header X-Admin-Key pour l'authentification.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'stamply_admin_default_change_me';

function adminHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Admin-Key': ADMIN_KEY,
  };
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
  commerçants: {
    total: number;
    actifs: number;
    avec_stripe: number;
  };
  inscriptions_par_mois: Record<string, number>;
  cartes: number;
  visites_30j: number;
  boutiques: number;
  commercants_recents: Array<{
    id: string;
    email: string;
    nom_enseigne: string;
    created_at: string;
    is_active: boolean;
  }>;
}

export interface AdminCommercant {
  id: string;
  email: string;
  nom_enseigne: string;
  prenom?: string;
  nom?: string;
  telephone?: string;
  created_at: string;
  is_active: boolean;
  stripe_customer_id?: string;
  stats?: {
    boutiques: number;
    cartes: number;
    visites_30j: number;
  };
  dernieres_notifications?: Array<{
    id: string;
    type: string;
    titre: string;
    created_at: string;
  }>;
}

export interface AdminCommercantsList {
  commerçants: AdminCommercant[];
  total: number;
  page: number;
  limit: number;
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
  limit: number;
}

export interface AdminLog {
  id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: any;
  created_at: string;
}

export interface AdminLogsList {
  logs: AdminLog[];
  total: number;
  page: number;
  limit: number;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

export const adminApi = {
  // Stats globales
  stats: () => adminRequest<AdminStats>('/api/admin/stats'),

  // Commerçants
  listCommerçants: (params?: { page?: number; limit?: number; search?: string; statut?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return adminRequest<AdminCommercantsList>(`/api/admin/commercants${q ? '?' + q : ''}`);
  },
  getCommercant: (id: string) => adminRequest<AdminCommercant>(`/api/admin/commercants/${id}`),
  updateCommercant: (id: string, data: Partial<AdminCommercant>) =>
    adminRequest<AdminCommercant>(`/api/admin/commercants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
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

  // Feedbacks
  feedbacks: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return adminRequest<AdminFeedbacksList>(`/api/admin/feedbacks${q ? '?' + q : ''}`);
  },

  // Logs
  logs: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return adminRequest<AdminLogsList>(`/api/admin/logs${q ? '?' + q : ''}`);
  },
};
