/**
 * Stamply Image Upload — Upload d'images via le backend API
 * 
 * Le backend utilise la Supabase service role key (contourne RLS).
 * Le frontend envoie le fichier via multipart/form-data à /api/images/upload.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('stamply_token');
}

/**
 * Upload une image via le backend API
 * Retourne l'URL publique de l'image
 */
export async function uploadCardImage(
  file: File,
  type: 'background' | 'logo',
  _commercantId?: string
): Promise<string> {
  const token = getToken();
  if (!token) {
    throw new Error('Non authentifié');
  }

  // Validation côté client
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Le fichier est trop volumineux (max 5MB)');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format non supporté (JPG, PNG, WebP uniquement)');
  }

  // Envoyer via multipart/form-data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const res = await fetch(`${API_URL}/api/images/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body?.error || `Erreur upload (${res.status})`);
  }

  return body.data.url;
}
