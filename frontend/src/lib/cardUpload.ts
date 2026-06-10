/**
 * Stamply Image Upload — Upload d'images vers Supabase Storage
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

const BUCKET_NAME = 'card-assets';

/**
 * Upload une image vers Supabase Storage
 * Retourne l'URL publique de l'image
 */
export async function uploadCardImage(
  file: File,
  type: 'background' | 'logo',
  commercantId?: string
): Promise<string> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase non configuré');
  }

  // Validation
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Le fichier est trop volumineux (max 5MB)');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format non supporté (JPG, PNG, WebP uniquement)');
  }

  // Générer un nom de fichier unique
  const ext = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const prefix = commercantId ? `merchant_${commercantId}` : 'anon';
  const fileName = `${prefix}/${type}_${timestamp}_${random}.${ext}`;

  // Upload
  const { data, error } = await client.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Erreur upload: ${error.message}`);
  }

  // Récupérer l'URL publique
  const { data: urlData } = client.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Supprime une image de Supabase Storage
 */
export async function deleteCardImage(url: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  // Extraire le path depuis l'URL
  const urlParts = url.split(`/${BUCKET_NAME}/`);
  if (urlParts.length < 2) return;
  
  const path = urlParts[1];
  await client.storage.from(BUCKET_NAME).remove([path]);
}
