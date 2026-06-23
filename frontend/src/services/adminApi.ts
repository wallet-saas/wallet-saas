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
  updated_at?: string;
  is_active?: boolean;
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
  contenu?: string;
  source: string;
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

export interface ServiceStatus {
  google_wallet: { status: string; message: string; issuer_id?: string };
  fcm: { status: string; message: string };
  stripe: { status: string; message: string };
  apple_wallet: { status: string; message: string };
  supabase: { status: string; message: string };
  backend: { status: string; message: string; uptime?: number };
}

export interface AdminClient {
  id: string;
  pass_type: string;
  pass_serial_number: string;
  pass_url: string;
  qr_code_url: string;
  actif: boolean;
  points: number;
  google_wallet_url: string;
  apple_wallet_url: string;
  installed: boolean;
  commercant_id: string;
  commercant_nom: string;
  created_at: string;
}

export interface AdminClientsList {
  clients: AdminClient[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminScan {
  id: string;
  client_id: string | null;
  commercant_id: string;
  boutique_id: string | null;
  type_action: string;
  created_at: string;
  boutiques?: { nom: string };
}

export interface AdminScansList {
  scans: AdminScan[];
  total: number;
  scans_today: number;
  scans_orphelins: number;
  page: number;
  totalPages: number;
}

export interface NotificationStats {
  total: number;
  today: number;
  push_reels: number;
  simulation: number;
  recentes: any[];
  mode: string;
}

export interface AdminTemplate {
  commercant_id: string;
  commercant_nom: string;
  templates: any[];
}

export interface AdminTemplatesList {
  templates: AdminTemplate[];
  total: number;
}

export interface AdminOffre {
  id: string;
  titre: string;
  description: string;
  code_promo: string;
  reduction_pct: number;
  reduction_montant: number;
  date_debut: string;
  date_fin: string | null;
  actif: boolean;
  total_envoyes: number;
  total_utilises: number;
  commercant_id: string;
  created_at: string;
  commercants?: { nom_enseigne: string };
}

export interface AdminOffresList {
  offres: AdminOffre[];
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
  forceWallet: (id: string) =>
    adminRequest<{ message: string }>(`/api/admin/commercants/${id}/force-wallet`, { method: 'POST' }),

  feedbacks: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return adminRequest<AdminFeedbacksList>(`/api/admin/feedbacks${q ? '?' + q : ''}`);
  },

  logs: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return adminRequest<AdminLogsList>(`/api/admin/logs${q ? '?' + q : ''}`);
  },

  // Nouvelles routes V2
  status: () => adminRequest<ServiceStatus>('/api/admin/status'),

  listClients: (params?: { page?: number; limit?: number; search?: string; commercant_id?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return adminRequest<AdminClientsList>(`/api/admin/clients${q ? '?' + q : ''}`);
  },

  listScans: (params?: { page?: number; limit?: number; commercant_id?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return adminRequest<AdminScansList>(`/api/admin/scans${q ? '?' + q : ''}`);
  },

  notificationsStats: () => adminRequest<NotificationStats>('/api/admin/notifications/stats'),

  pushTest: (commercant_id: string, titre?: string, message?: string) =>
    adminRequest<{ success: boolean; message: string; mode: string }>('/api/admin/push-test', {
      method: 'POST',
      body: JSON.stringify({ commercant_id, titre, message }),
    }),

  listTemplates: () => adminRequest<AdminTemplatesList>('/api/admin/templates'),

  listOffres: (params?: { page?: number; limit?: number; statut?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return adminRequest<AdminOffresList>(`/api/admin/offres${q ? '?' + q : ''}`);
  },

  createOffre: (data: { titre: string; description?: string; type_recompense?: string; valeur?: number; date_debut?: string; date_fin?: string; commercant_id: string }) =>
    adminRequest<AdminOffre>('/api/admin/offres', { method: 'POST', body: JSON.stringify(data) }),

  deleteOffre: (id: string) =>
    adminRequest<{ message: string }>(`/api/admin/offres/${id}`, { method: 'DELETE' }),
};
