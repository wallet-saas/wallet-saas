# 🚀 Guide de déploiement Stamply

## Architecture
- **Backend** : Node.js/Express → **Render** (gratuit)
- **Frontend** : Next.js → **Vercel** (gratuit)
- **Base de données** : PostgreSQL → **Supabase** (gratuit)
- **Paiements** : Stripe (mode test → live)

---

## Étape 1 — GitHub (5 min)

1. Va sur https://github.com/new
2. Crée un repo privé nommé `stamply`
3. Push le code :
```bash
cd /home/ubuntu/stamply/wallet-saas-main
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TON_USERNAME/stamply.git
git push -u origin main
```

---

## Étape 2 — Render (Backend) (5 min)

1. Va sur https://render.com → Sign up with GitHub
2. Clique **"New +"** → **"Web Service"**
3. Connecte ton repo `stamply`
4. Configure :
   - **Name** : `stamply-backend`
   - **Root Directory** : `backend`
   - **Runtime** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `node src/index.js`
   - **Plan** : Free
5. Ajoute les variables d'environnement (une par une) :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `SUPABASE_URL` | `https://oouknqnwptunfjlbtkfp.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | (copier depuis ton .env actuel) |
| `JWT_SECRET` | (copier depuis ton .env actuel) |
| `STRIPE_SECRET_KEY` | (copier depuis ton .env actuel) |
| `STRIPE_PUBLISHABLE_KEY` | (copier depuis ton .env actuel) |
| `STRIPE_PRICE_ID` | (copier depuis ton .env actuel) |
| `FRONTEND_URL` | `https://stamply.vercel.app` (à mettre à jour après étape 3) |
| `BACKEND_URL` | `https://stamply-backend.onrender.com` (auto-généré par Render) |
| `GOOGLE_WALLET_ISSUER_ID` | `3388000000023112631` |
| `GOOGLE_WALLET_KEY_FILE` | `./config/google-wallet-key.json` |

6. Clique **"Create Web Service"**
7. Attends le build (2-3 min)
8. Note l'URL : `https://stamply-backend.onrender.com`

---

## Étape 3 — Vercel (Frontend) (5 min)

1. Va sur https://vercel.com → Sign up with GitHub
2. Clique **"Add New..."** → **"Project"**
3. Importe le repo `stamply`
4. Configure :
   - **Root Directory** : `frontend`
   - **Framework** : Next.js (auto-détecté)
5. Ajoute les variables d'environnement :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://stamply-backend.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://oouknqnwptunfjlbtkfp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (depuis Supabase → Settings → API) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | (copier depuis ton .env actuel) |

6. Clique **"Deploy"**
7. Note l'URL : `https://stamply.vercel.app`

---

## Étape 4 — Mettre à jour les URLs (2 min)

1. Dans Render → `stamply-backend` → Environment → mets à jour `FRONTEND_URL` avec l'URL Vercel
2. Dans Vercel → `stamply` → Settings → Environment Variables → mets à jour `NEXT_PUBLIC_API_URL` avec l'URL Render
3. Redéploie les deux

---

## Étape 5 — Tester

1. Ouvre `https://stamply.vercel.app`
2. Crée un compte commerçant
3. Configure ta carte (setup-card)
4. Ouvre la page d'installation client
5. Teste le scan QR
6. Vérifie le dashboard

---

## ⚠️ Notes importantes

### Google Wallet
- La clé `google-wallet-key.json` est déjà en place dans `backend/config/`
- Elle est dans `.gitignore` → ne sera pas push sur GitHub
- **Sur Render** : il faut ajouter la clé via un "Secret File" dans Render → Settings → Secret Files → ajoute `google-wallet-key.json` avec le contenu du fichier

### Supabase
- Les migrations SQL sont dans `backend/migrations/`
- Exécute-les dans Supabase Dashboard → SQL Editor dans l'ordre (004 → 009)

### Stripe
- En mode test : utilise `sk_test_...` et `pk_test_...`
- Pour passer en live : remplace par `sk_live_...` et `pk_live_...`
- Configure le webhook Stripe : `https://stamply-backend.onrender.com/api/webhooks/stripe`

### Push Notifications (FCM)
- Pour activer les push Android : ajoute `FCM_KEY_JSON` dans Render (contenu du JSON Firebase)
- Pour iOS (APNS) : ajoute `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID`, `APNS_KEY_PATH`
- Sans ces variables, les notifications sont simulées (loggées en console)
