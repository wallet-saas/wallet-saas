# 🏷️ Stamply — SaaS B2B Cartes de Fidélité Digitales

**Stamply** est une plateforme SaaS B2B qui permet aux TPE françaises de créer et gérer des cartes de fidélité digitales compatibles **Google Wallet** et **Apple Wallet**.

## 🎯 Concept

Un commerçant s'inscrit → configure sa carte de fidélité → ses clients l'installent dans Google Wallet → le commerçant scanne le QR code en caisse → les points s'incrémentent automatiquement.

**Tarification** : 49€/mois par commerçant (via Stripe)

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API    │────▶│   Supabase      │
│   Next.js       │     │   Node.js/Express│     │   PostgreSQL    │
│   (Vercel)      │◀────│   (Render)       │◀────│   + Auth        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Google Wallet   │
                        │  API             │
                        └──────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Stripe          │
                        │  (Paiements)     │
                        └──────────────────┘
```

## 📁 Structure du projet

```
wallet-saas-main/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration Supabase, Stripe, etc.
│   │   ├── controllers/     # Logique métier des endpoints
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   ├── routes/          # Définition des routes API
│   │   ├── services/        # Services externes (Google Wallet, Stripe, FCM)
│   │   ├── database/        # Schéma SQL et migrations
│   │   └── index.js         # Point d'entrée Express
│   ├── migrations/          # Fichiers SQL de migration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Pages Next.js (dashboard, install, etc.)
│   │   ├── components/      # Composants UI réutilisables
│   │   ├── hooks/           # Hooks React (useAuth, etc.)
│   │   ├── services/        # Client API
│   │   └── styles/          # CSS global + Tailwind
│   └── package.json
├── render.yaml              # Configuration Render
├── vercel.json              # Configuration Vercel
└── README.md
```

## 🚀 Installation locale

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase
- Compte Google Cloud (pour Google Wallet API)
- Compte Stripe

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Remplir les variables d'environnement
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Remplir les variables d'environnement
npm run dev
```

## 🔑 Variables d'environnement

### Backend (.env)

```env
# Serveur
NODE_ENV=development
PORT=3000

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role

# JWT
JWT_SECRET=votre-secret-jwt-tres-long

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Wallet
GOOGLE_WALLET_ISSUER_ID=3388000000023112631
GOOGLE_WALLET_KEY_JSON={"type":"service_account",...}

# URLs
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000

# Firebase FCM (optionnel — notifications push)
FCM_KEY_JSON={"type":"service_account",...}
```

## 📡 API Endpoints

### Auth
| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/auth/register` | Inscription commerçant | Non |
| POST | `/api/auth/login` | Connexion | Non |
| GET | `/api/auth/me` | Profil connecté | Oui |
| PUT | `/api/auth/change-password` | Changer mot de passe | Oui |

### Google Wallet
| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/wallet/setup` | Configurer la LoyaltyClass | Oui |
| PUT | `/api/wallet/setup` | Mettre à jour la LoyaltyClass | Oui |
| POST | `/api/wallet/generate` | Générer une carte | Oui |
| GET | `/api/wallet/cartes` | Liste des cartes | Oui |
| POST | `/api/wallet/generate-for/:id` | Générer pour un client | Non |
| GET | `/api/wallet/install/:serial` | Page d'installation | Non |
| GET | `/api/wallet/download/:serial` | Télécharger .pkpass | Non |

### Scan QR
| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/scan` | Scanner une carte | Oui |
| GET | `/api/scan/history` | Historique des scans | Oui |
| GET | `/api/scan/page` | Interface scan caméra | Non |

### Notifications
| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/notifications/send` | Envoyer notification | Oui |
| GET | `/api/notifications/history` | Historique | Oui |
| GET | `/api/notifications/stats` | Statistiques | Oui |

### Autres
| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/commercants/me` | Profil commerçant | Oui |
| PUT | `/api/commercants/me` | Modifier profil | Oui |
| GET | `/api/analytics` | Statistiques | Oui |
| GET | `/api/menus/list` | Liste des menus | Oui |
| POST | `/api/menus/create` | Créer un menu | Oui |
| GET | `/api/avis/list` | Liste des avis | Oui |
| GET | `/api/offres/list` | Liste des offres | Oui |
| POST | `/api/offres/create` | Créer une offre | Oui |
| GET | `/api/subscription/status` | Statut abonnement | Oui |
| GET | `/api/images/:id` | Logo commerçant | Non |

## 🗄️ Base de données (Supabase)

### Tables principales

- **commercants** — Commerçants inscrits
- **cartes** — Cartes de fidélité générées
- **visites** — Historique des scans/visites
- **notifications** — Notifications push envoyées
- **offres** — Offres flash
- **menus** — Carte du restaurant
- **avis** — Avis clients
- **clients** — Clients (device tokens pour notifications)

### Migrations

Les fichiers SQL dans `backend/migrations/` doivent être exécutés dans l'ordre dans le Supabase SQL Editor.

## 🔒 Sécurité

- **JWT** — Authentification par token (expiration 7 jours)
- **Rate limiting** — Protection brute-force sur login/register
- **Validation** — Validation des entrées sur tous les endpoints
- **Helmet** — Headers HTTP sécurisés
- **CORS** — Configuration stricte
- **RLS** — Row Level Security sur Supabase

## 📱 Flux utilisateur

### Commerçant
1. Inscription → création du compte
2. Configuration de la carte (template métier, couleurs, logo)
3. Génération des cartes pour les clients
4. Scan QR en caisse → points incrémentés
5. Envoi de notifications push aux clients
6. Création d'offres flash

### Client
1. Reçoit un lien d'installation de la part du commerçant
2. Clique sur "Ajouter à Google Wallet"
3. La carte apparaît dans son Google Wallet
4. Présente la carte en caisse → scan QR
5. Reçoit des notifications push (offres, récompenses)

## 🚀 Déploiement

### Backend (Render)
1. Connecter le repo GitHub à Render
2. Configurer les variables d'environnement
3. Le déploiement est automatique à chaque push

### Frontend (Vercel)
1. Connecter le repo GitHub à Vercel
2. Configurer les variables d'environnement
3. Le déploiement est automatique à chaque push

### Supabase
1. Créer un projet Supabase
2. Exécuter les migrations SQL
3. Configurer l'authentification

## 📝 License

Propriétaire — Stamply © 2026
