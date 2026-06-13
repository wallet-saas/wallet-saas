const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('stamply_token');
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(body?.error || body?.message || 'Erreur serveur', res.status);
  }

  // Backend wraps all successful responses in { success: true, data: { ... } }
  if (body && typeof body === 'object' && body.success === true && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; commercant: Commercant }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: RegisterData) =>
    request<{ token: string; commercant: Commercant }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => request<{ commercant: Commercant }>('/api/auth/me'),
  changePassword: (ancien_password: string, nouveau_password: string) =>
    request<{ message: string }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ ancien_password, nouveau_password }),
    }),
};

// ─── Commerçant ───────────────────────────────────────────────────────────────
export const commercantApi = {
  update: (data: Partial<Commercant>) =>
    request<{ commercant: Commercant }>('/api/commercants/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  qrCode: () =>
    request<{ install_url: string; nom_enseigne: string }>('/api/commercants/qr-code'),
};

// ─── Subscription ────────────────────────────────────────────────────────────
export const subscriptionApi = {
  status: () =>
    request<{ statut: string; date_fin: string | null; has_subscription: boolean }>(
      '/api/subscription/status'
    ),
  sync: () =>
    request<{ abonnement_statut: string; stripe_subscription_id: string }>(
      '/api/subscription/sync',
      { method: 'POST' }
    ),
};

// ─── Wallet / Cartes ──────────────────────────────────────────────────────────
export const walletApi = {
  generate: () =>
    request<{
      pass_serial_number: string;
      install_url: string;
      qr_code_url: string;
      google_wallet_url: string | null;
      apple_wallet_url: string | null;
      google_wallet_configured: boolean;
      apple_wallet_configured: boolean;
    }>('/api/wallet/generate', { method: 'POST' }),
  list: (page = 1, limit = 20) =>
    request<{ cartes: Carte[]; total: number; page: number; totalPages: number }>(
      `/api/wallet/cartes?page=${page}&limit=${limit}`
    ),
  setup: (data: WalletSetupData) =>
    request<{ wallet_class_configured: boolean }>('/api/wallet/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSetup: (data: WalletSetupData) =>
    request<{ wallet_class_configured: boolean }>('/api/wallet/setup', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ─── Scan ─────────────────────────────────────────────────────────────────────
export const scanApi = {
  scan: (passSerialNumber: string) =>
    request<ScanResult>('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ pass_serial_number: passSerialNumber }),
    }),
  history: (limit = 20, offset = 0) =>
    request<{ visites: Visite[]; total: number }>(
      `/api/scan/history?limit=${limit}&offset=${offset}`
    ),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  send: (titre: string, message: string, cible: 'tous' | 'actifs' | 'dormants') =>
    request<NotifSendResult>('/api/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ titre, message, cible }),
    }),
  history: (limit = 20, offset = 0) =>
    request<{ notifications: Notification[]; total: number }>(
      `/api/notifications/history?limit=${limit}&offset=${offset}`
    ),
  stats: () => request<NotifStats>('/api/notifications/stats'),
};

// ─── Avis ─────────────────────────────────────────────────────────────────────
export interface AvisTemplate {
  id: string;
  nom: string;
  texte: string;
}

export interface AvisTemplatesFilled {
  templates: Array<{
    id: string;
    nom: string;
    texte_original: string;
    texte_rempli: string;
  }>;
  nom_enseigne: string;
  note: number;
  contenu: string;
}

export const avisApi = {
  list: (params?: { note?: number; source?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ avis: Avis[]; total: number; moyenneNote: number }>(
      `/api/avis/list${q ? '?' + q : ''}`
    );
  },
  getTemplates: (avisId: string) =>
    request<AvisTemplatesFilled>('/api/avis/get-templates', {
      method: 'POST',
      body: JSON.stringify({ avis_id: avisId }),
    }),
  saveTemplates: (templates: AvisTemplate[]) =>
    request<{ templates: AvisTemplate[] }>('/api/avis/templates', {
      method: 'PUT',
      body: JSON.stringify({ templates }),
    }),
  sendResponse: (avisId: string, reponse: string) =>
    request<{ success: boolean }>('/api/avis/send-response', {
      method: 'POST',
      body: JSON.stringify({ avis_id: avisId, reponse }),
    }),
};

// ─── Menus ────────────────────────────────────────────────────────────────────
export const menusApi = {
  list: (params?: { categorie?: string; disponible?: boolean }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ menus: Menu[]; parCategorie: Record<string, Menu[]> }>(
      `/api/menus/list${q ? '?' + q : ''}`
    );
  },
  create: (data: Omit<Menu, 'id' | 'commercant_id' | 'created_at'>) =>
    request<{ menu: Menu }>('/api/menus/create', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Menu>) =>
    request<{ menu: Menu }>(`/api/menus/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/menus/${id}`, { method: 'DELETE' }),
  toggle: (id: string) =>
    request<{ menu: Menu }>(`/api/menus/${id}/toggle`, { method: 'PATCH' }),
  pushSelection: (menuIds: string[], groupeId?: string) =>
    request<{ success: boolean; simulation: boolean; totalEnvoyes: number; message: string; data: { menus: any[]; totalEnvoyes: number; message: string } }>(
      '/api/menus/push-selection',
      { method: 'POST', body: JSON.stringify({ menu_ids: menuIds, groupe_id: groupeId }) }
    ),
  listGroupes: () =>
    request<{ groupes: MenuGroupe[] }>('/api/menus/groupes'),
  saveGroupes: (groupes: MenuGroupe[]) =>
    request<{ success: boolean; message: string }>(
      '/api/menus/groupes',
      { method: 'PUT', body: JSON.stringify({ groupes }) }
    ),
};

// ─── Offres ───────────────────────────────────────────────────────────────────
export const offresApi = {
  list: () => request<{ offres: Offre[] }>('/api/offres/list'),
  create: (data: Omit<Offre, 'id' | 'commercant_id' | 'created_at' | 'expiree'>) =>
    request<{ offre: Offre }>('/api/offres/create', { method: 'POST', body: JSON.stringify(data) }),
  send: (id: string, cible: string) =>
    request<{ success: boolean }>(`/api/offres/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({ cible }),
    }),
  stats: (id: string) => request<OffreStats>(`/api/offres/${id}/stats`),
};

// ─── Géolocalisation ──────────────────────────────────────────────────────────
export const geolocationApi = {
  stats: () => request<GeoStats>('/api/geolocation/stats'),
  trigger: (carteId: string) =>
    request<{ success: boolean }>('/api/geolocation/trigger', {
      method: 'POST',
      body: JSON.stringify({ carte_id: carteId }),
    }),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  overview: () => request<AnalyticsOverview>('/api/analytics/overview'),
  cards: () => request<any>('/api/analytics/cards'),
  notifications: () => request<any>('/api/analytics/notifications'),
  clientsDormants: () => request<{ clients: ClientDormant[]; total: number }>('/api/analytics/clients-dormants'),
  avis: () => request<any>('/api/analytics/avis'),
  offres: () => request<any>('/api/analytics/offres'),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Commercant {
  id: string;
  email: string;
  nom_enseigne: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  // Card customisation — backend column names
  carte_couleur_primaire?: string;
  carte_couleur_secondaire?: string;
  carte_logo_url?: string;
  // Aliases used in parametres form (mapped on read)
  couleur_primaire?: string;
  couleur_secondaire?: string;
  logo_url?: string;
  // Loyalty
  points_par_visite?: number;
  points_recompense?: number;
  points_requis_recompense?: number;
  // Modules — backend column names
  module_avis_google?: boolean;
  module_geolocalisation?: boolean;
  module_menu_jour?: boolean;
  module_offres_flash?: boolean;
  module_notifications?: boolean;
  module_boutiques?: boolean;
  // Aliases used in frontend
  module_avis?: boolean;
  module_geoloc?: boolean;
  module_menus?: boolean;
  module_offres?: boolean;
  module_fidelite?: boolean;
  // Notifications settings
  notif_max_par_jour?: number;
  notif_heure_debut?: number;
  notif_heure_fin?: number;
  notif_template_defaut?: string;
  notif_mode_simulation?: boolean;
  // Avis settings
  avis_seuil_reponse?: number;
  avis_template_auto?: string;
  avis_reponse_auto?: boolean;
  // Menus settings
  menu_categories?: string | string[];
  menu_devise?: string;
  menu_afficher_prix?: boolean;
  // Offres settings
  offres_duree_defaut?: number;
  offres_limite_client?: number;
  offres_notif_auto?: boolean;
  offres_code_auto?: boolean;
  // Geoloc settings
  geoloc_message?: string;
  geoloc_heure_debut?: number;
  geoloc_heure_fin?: number;
  // Auto-review settings
  auto_review_message?: string;
  auto_review_seuil_etoiles?: number;
  auto_review_alerte_email?: boolean;
  // Avis templates (JSONB)
  avis_templates?: AvisTemplate[];
  // Boutiques settings
  boutique_defaut_id?: string;
  // Geoloc & Avis
  google_place_id?: string;
  google_place_url?: string;
  rayon_geoloc_metres?: number;
  delai_notif_avis_minutes?: number;
  delai_avis_minutes?: number;
  latitude?: number;
  longitude?: number;
  // Card layout
  carte_layout?: string;
  texte_perso_bas_carte?: string;
  style_texte?: string;
  // Subscription — backend column name
  abonnement_statut?: string;
  statut_abonnement?: string;
  abonnement_debut?: string;
  abonnement_fin?: string;
  created_at?: string;
  // Wallet setup
  wallet_class_configured?: boolean;
  template_type?: string;
  carte_programme_nom?: string;
  carte_recompense_description?: string;
  // Premium card design (JSON blob)
  card_design?: string;
  carte_background_image_url?: string;
  carte_font_family?: string;
  carte_text_color?: string;
  carte_text_color_auto?: boolean;
  carte_tier_name?: string;
  carte_tier_color?: string;
  carte_overlay_opacity?: number;
  carte_overlay_color?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nom_enseigne: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
}

export interface Carte {
  id: string;
  pass_serial_number: string;
  points: number;
  last_visit_at?: string;
  created_at: string;
  client_id?: string;
  google_wallet_url?: string | null;
  apple_wallet_url?: string | null;
}

export interface ScanResult {
  success: boolean;
  points: number;
  message: string;
  carte?: Carte;
}

export interface Visite {
  id: string;
  carte_id: string;
  commercant_id: string;
  created_at: string;
  pass_serial_number?: string;
}

export interface Notification {
  id: string;
  titre: string;
  message: string;
  cible: string;
  total_cible: number;
  total_envoyes: number;
  total_ouverts: number;
  simulation: boolean;
  created_at: string;
}

export interface NotifSendResult {
  success: boolean;
  totalCible: number;
  totalEnvoyes: number;
  simulation: boolean;
}

export interface NotifStats {
  totalEnvoyes: number;
  totalOuverts: number;
  tauxOuverture: number;
  parCible: Record<string, { count: number; totalEnvoyes: number; totalOuverts: number }>;
  apns: string;
  fcm: string;
}

export interface Avis {
  id: string;
  carte_id: string;
  note: number;
  contenu?: string;
  source: string;
  reponse_suggeree?: string;
  reponse_envoyee?: string;
  created_at: string;
}

export interface Menu {
  id: string;
  commercant_id: string;
  titre: string;
  description?: string;
  prix?: number;
  categorie?: string;
  image_url?: string;
  disponible: boolean;
  created_at: string;
}

export interface MenuGroupe {
  id: string;
  nom: string;
  menu_ids: string[];
}

export interface Offre {
  id: string;
  commercant_id: string;
  titre: string;
  description?: string;
  code_promo?: string;
  reduction_pourcentage?: number;
  reduction_montant?: number;
  date_debut?: string;
  date_fin?: string;
  total_envoyes: number;
  total_utilises: number;
  expiree?: boolean;
  created_at: string;
}

export interface OffreStats {
  total_envoyes: number;
  total_utilises: number;
  taux_utilisation: number;
}

export interface GeoStats {
  moduleActif: boolean;
  rayon: number;
  positionConfiguree: boolean;
  totalNotifications: number;
  totalVisitesGeoloc: number;
  tauxConversion: number;
}

export interface AnalyticsOverview {
  totalCartes: number;
  totalVisites: number;
  totalNotifications: number;
  clientsDormants: number;
  cartesInstalleesCetteSemaine: number;
  visitesLastMonth: number;
}

export interface ClientDormant {
  id: string;
  device_token?: string;
  plateforme?: string;
  statut: string;
  derniere_visite?: string;
  jours_inactif: number;
  carte?: Carte;
}

// ─── Boutiques (Multi-commerçant) ──────────────────────────────────────────────
export const boutiquesApi = {
  list: () =>
    request<{ count: number; data: Boutique[] }>('/api/boutiques'),
  get: (id: string) =>
    request<Boutique>(`/api/boutiques/${id}`),
  create: (data: Partial<Boutique>) =>
    request<Boutique>('/api/boutiques', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Boutique>) =>
    request<Boutique>(`/api/boutiques/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ message: string }>(`/api/boutiques/${id}`, {
      method: 'DELETE',
    }),
  stats: (id: string) =>
    request<{ totalCartes: number; totalVisites: number; totalAvis: number; totalOffres: number }>(
      `/api/boutiques/${id}/stats`
    ),
  globalStats: () =>
    request<{
      totalBoutiques: number;
      totalCartes: number;
      totalVisites: number;
      totalAvis: number;
      totalNotifications: number;
      boutiques: Array<{
        id: string;
        nom: string;
        pointsRecompense: number;
        totalCartes: number;
        totalVisites: number;
      }>;
    }>('/api/boutiques/global-stats'),
};

// ─── Auto-Review (GMB) ─────────────────────────────────────────────────────────
export const autoReviewApi = {
  settings: () =>
    request<{
      module_avis_google: boolean;
      delai_notif_avis_minutes: number;
      google_place_url: string | null;
      google_place_id: string | null;
    }>('/api/auto-review/settings'),
  updateSettings: (data: {
    module_avis_google?: boolean;
    delai_notif_avis_minutes?: number;
    google_place_url?: string;
    google_place_id?: string;
  }) =>
    request<{
      module_avis_google: boolean;
      delai_notif_avis_minutes: number;
      google_place_url: string | null;
      google_place_id: string | null;
    }>('/api/auto-review/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  feedback: (limit = 50, offset = 0) =>
    request<{ total: number; data: Avis[] }>(
      `/api/auto-review/feedback?limit=${limit}&offset=${offset}`
    ),
};

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface Boutique {
  id: string;
  commercant_id: string;
  nom: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  telephone?: string;
  email?: string;
  google_place_url?: string;
  google_place_id?: string;
  carte_couleur_primaire: string;
  carte_couleur_secondaire: string;
  carte_programme_nom?: string;
  carte_recompense_description?: string;
  points_recompense: number;
  logo_url?: string;
  template_type?: string;
  module_avis_google: boolean;
  delai_notif_avis_minutes: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletSetupData {
  template_type?: string;
  programme_nom: string;
  couleur_primaire: string;
  couleur_secondaire?: string;
  logo_url?: string;
  points_recompense: number;
  recompense_description: string;
  layout?: 'classic' | 'modern' | 'minimal';
  texte_perso_bas_carte?: string;
  style_texte?: 'normal' | 'gras' | 'italique';
  // Premium card design fields
  card_design?: string;
  carte_background_image_url?: string;
  carte_logo_url?: string;
  carte_font_family?: string;
  carte_text_color?: string;
  carte_text_color_auto?: boolean;
  carte_tier_name?: string;
  carte_tier_color?: string;
  carte_overlay_opacity?: number;
  carte_overlay_color?: string;
  // Tampons system
  tampons_palier?: number;
}

export { ApiError };
