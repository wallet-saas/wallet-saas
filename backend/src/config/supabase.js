const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Vérifier que les variables d'environnement sont définies
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERREUR: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquants dans .env');
  // Ne pas process.exit() dans un module — laisser le caller gérer l'erreur
  // Le premier appel à Supabase échouera avec un message clair
}

// Créer le client Supabase avec la clé SERVICE_ROLE (accès complet backend)
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('✅ Connexion Supabase établie');

// ⚠️ IMPORTANT : Exporter avec des accolades pour correspondre à l'import
module.exports = { supabase };