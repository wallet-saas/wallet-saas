# 🃏 STAMPLY — État du Projet

## Résumé exécutif

**Stamply est une SaaS B2B de cartes de fidélité digitales** pour TPE françaises.
Les commerçants créent des cartes de fidélité Google Wallet en 10 minutes.
Les clients installent la carte en 5 secondes via QR code, sans app à télécharger.

**Prix : 49€/mois par commerçant**

## URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://stamply-gamma.vercel.app |
| Backend (Render) | https://stamply-backend-gn8z.onrender.com |
| GitHub | https://github.com/wallet-saas/wallet-saas |
| Supabase | https://app.supabase.com/project/oouknqnwptunfjlbtkfp |

## Stack Technique

- **Backend** : Node.js + Express (Render)
- **Frontend** : Next.js + Tailwind CSS (Vercel) — PWA compatible
- **Base de données** : PostgreSQL (Supabase)
- **Wallet** : Google Wallet API (service account LIVE)
- **Paiements** : Stripe (webhooks)
- **Notifications** : Firebase FCM (mode simulation, prêt pour réel)
- **Auth** : JWT + bcrypt
- **Validation** : express-validator
- **Sécurité** : Helmet, CORS, rate limiting

## Flux Complet (V1 + V2)

1. **Commerçant** s'inscrit → configure sa carte (design libre, templates suggérés)
2. **Backend** crée la LoyaltyClass Google Wallet automatiquement
3. **Commerçant** peut gérer plusieurs boutiques (multi-commerçant)
4. **Client** installe la carte depuis /install/:commercantId → Google Wallet
5. **Client** scanne son QR code en caisse → crédité d'un point + badges
6. **Après X jours** → notification d'avis automatique
7. **Client** donne une note (1-5 étoiles)
8. **4+ étoiles** → redirigé vers Google (avis public)
9. **<4 étoiles** → formulaire de feedback privé (commerçant peut consulter)

## État des Features (testé en live le 8 juin 2026)

### V1 — ✅ TERMINÉE (17/17)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Auth (register/login/me) | ✅ | JWT 7 jours, bcrypt |
| 2 | Google Wallet (setup → generate → URL) | ✅ | LoyaltyClass auto-créée, mode live |
| 3 | Scan QR caisse | ✅ | Rate limiting 30s, points auto, badges |
| 4 | Notifications push | ✅ | Mode simulation (FCM prêt) |
| 5 | Offres flash | ✅ | CRUD + envoi notif |
| 6 | Analytics | ✅ | Charts + stats + clients dormants |
| 7 | Menus | ✅ | CRUD complet |
| 8 | Avis | ✅ | List + réponse IA |
| 9 | Géolocalisation | ✅ | Stats + trigger |
| 10 | Stripe checkout | ✅ | Code prêt, clés configurées |
| 11 | Subscription status | ✅ | Format {success, data} |
| 12 | Images logo | ✅ | Placeholder intelligent |
| 13 | Health check | ✅ | /api/health + /api/health/diagnostics |
| 14 | Recherche commerçants | ✅ | Par nom + catégorie |
| 15 | Landing page | ✅ | Recherche, catégories, pricing |
| 16 | Badges clients | ✅ | 5 niveaux (1, 5, 10, 25, 50 pts) |
| 17 | Page installation | ✅ | QR code + bouton Google Wallet |

### V2 — ✅ TERMINÉE (5/5)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Avis automatiques (GMB) | ✅ | Notification après X jours configurable, 4+ → Google, <4 → feedback interne |
| 2 | Multi-commerçant | ✅ | Gestion de plusieurs boutiques, stats par boutique + globales |
| 3 | App mobile PWA | ✅ | Service worker, manifest, install prompt, offline support |
| 4 | Templates avancés | ✅ | 3 layouts (classic/modern/minimal), personnalisation totale, couleurs multiples |
| 5 | Design libre | ✅ | Templates = suggestions uniquement, tout est modifiable |

### Configuration manuelle requise (BOZO)
1. **FCM (Firebase)** — Clé pour notifications réelles
2. **Apple Wallet** — Certificat Apple Developer (~99$/an) — FAIRE PLUS TARD
3. **Stripe Webhook Secret** — Configurer dans Stripe Dashboard
4. **Supabase SQL** — Exécuter les migrations (voir backend/migrations/)

## Migrations SQL à exécuter

### Dans Supabase SQL Editor :
```sql
-- Table client_badges
-- Table boutiques  
-- Colonnes boutique_id sur les tables existantes
-- Voir backend/migrations/create_badges_table.sql
-- Voir backend/migrations/create_boutiques_table.sql
```

## Sécurité

- ✅ JWT authentification (expiration 7 jours)
- ✅ Rate limiting (login 5/min, register 3/10min, scan 30/min)
- ✅ Validation des entrées (express-validator)
- ✅ Helmet (headers HTTP sécurisés)
- ✅ CORS configuré
- ✅ RLS Supabase
- ✅ Mots de passe forts requis (8+ chars, maj, min, chiffre)
