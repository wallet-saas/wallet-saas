import { useState, useEffect, useCallback } from 'react';
import { authApi, type Commercant } from '@/services/api';

interface AuthState {
  commercant: Commercant | null;
  token: string | null;
  loading: boolean;
}

// Normalize backend field names → frontend aliases so all pages work uniformly.
// IMPORTANT: backend column names always take priority over cached aliases
// so that a value of `false` from the API correctly overrides a cached `true`.
function normalizeCommercant(c: Commercant): Commercant {
  return {
    ...c,
    // Subscription status — backend column is abonnement_statut
    statut_abonnement: c.abonnement_statut !== undefined ? c.abonnement_statut : c.statut_abonnement,
    // Card colours — backend columns have carte_ prefix
    couleur_primaire: c.carte_couleur_primaire !== undefined ? c.carte_couleur_primaire : c.couleur_primaire,
    couleur_secondaire: c.carte_couleur_secondaire !== undefined ? c.carte_couleur_secondaire : c.couleur_secondaire,
    logo_url: c.carte_logo_url !== undefined ? c.carte_logo_url : c.logo_url,
    // Modules — backend uses verbose column names; cast to boolean so null → false
    module_avis: c.module_avis_google !== undefined ? !!c.module_avis_google : !!c.module_avis,
    module_geoloc: c.module_geolocalisation !== undefined ? !!c.module_geolocalisation : !!c.module_geoloc,
    module_menus: c.module_menu_jour !== undefined ? !!c.module_menu_jour : !!c.module_menus,
    module_offres: c.module_offres_flash !== undefined ? !!c.module_offres_flash : !!c.module_offres,
    // Points reward threshold
    points_requis_recompense: c.points_recompense !== undefined ? c.points_recompense : c.points_requis_recompense,
    // Avis delay
    delai_avis_minutes: c.delai_notif_avis_minutes !== undefined ? c.delai_notif_avis_minutes : c.delai_avis_minutes,
  };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    commercant: null,
    token: null,
    loading: true,
  });

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('stamply_token');
    if (!token) {
      setState({ commercant: null, token: null, loading: false });
      return;
    }
    try {
      const { commercant } = await authApi.me();
      setState({ commercant: normalizeCommercant(commercant), token, loading: false });
    } catch {
      localStorage.removeItem('stamply_token');
      setState({ commercant: null, token: null, loading: false });
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { token, commercant } = await authApi.login(email, password);
    localStorage.setItem('stamply_token', token);
    const normalized = normalizeCommercant(commercant);
    setState({ commercant: normalized, token, loading: false });
    return normalized;
  };

  const register = async (data: Parameters<typeof authApi.register>[0]) => {
    const { token, commercant } = await authApi.register(data);
    localStorage.setItem('stamply_token', token);
    const normalized = normalizeCommercant(commercant);
    setState({ commercant: normalized, token, loading: false });
    return normalized;
  };

  const logout = () => {
    localStorage.removeItem('stamply_token');
    setState({ commercant: null, token: null, loading: false });
  };

  const updateCommercant = (updated: Partial<Commercant>) => {
    setState((prev) => ({
      ...prev,
      commercant: prev.commercant
        ? normalizeCommercant({ ...prev.commercant, ...updated })
        : null,
    }));
  };

  return {
    ...state,
    isAuthenticated: !!state.token && !!state.commercant,
    login,
    register,
    logout,
    updateCommercant,
    refreshUser: loadUser,
  };
}
