/**
 * Vérification de démarrage — à lancer avant chaque push.
 *
 * Charge chaque fichier de routes comme le ferait le serveur : une variable
 * oubliée (import manquant, faute de frappe) fait échouer le déploiement
 * Render en silence, et l'ancienne version continue de tourner. Ce contrôle
 * attrape l'erreur en local, en deux secondes.
 *
 * Usage : node verifier-demarrage.js
 */
const fs = require('fs');
const path = require('path');

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://exemple.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'cle-de-test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secret-de-test';

const dossierRoutes = path.join(__dirname, 'src', 'routes');
let echecs = 0;

for (const fichier of fs.readdirSync(dossierRoutes).filter(f => f.endsWith('.js'))) {
  try {
    require(path.join(dossierRoutes, fichier));
    console.log(`  ✅ ${fichier}`);
  } catch (err) {
    console.log(`  ❌ ${fichier} — ${err.message}`);
    echecs++;
  }
}

if (echecs > 0) {
  console.error(`\n${echecs} fichier(s) de routes ne se chargent pas : le déploiement Render échouerait.`);
  process.exit(1);
}
console.log('\nToutes les routes se chargent — le serveur peut démarrer.');
process.exit(0);
