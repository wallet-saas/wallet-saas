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
- **Frontend** : Next.js + Tailwind CSS (Vercel)
- **Base de données** : PostgreSQL (Supabase)
- **Wallet** : Google Wallet API (service account)
- **Paiements** : Stripe (webhooks)
- **Notifications** : Firebase FCM (simulation pour V1)
- **Auth** : JWT + bcrypt
- **Validation** : express-validator
- **Sécurité** : Helmet, CORS, rate limiting

## Flux Complet (V1)

1. **Commerçant** s'inscrit → configure sa carte (template métier ou custom)
2. **Backend** crée la LoyaltyClass Google Wallet automatiquement
3. **Commerçant** génère un QR code → l'affiche en caisse
4. **Client** scanne le QR → page d'installation avec bouton "Ajouter à Google Wallet"
5. **Client** ajoute la carte à Google Wallet (1 clic, pas d'app)
6. **Client** scanne son QR code en caisse → crédité d'un point
7. **À 10 points** → notification de récompense débloquée
8. **Commerçant** peut envoyer des notifications push à ses clients

## État des Features (testé en live le 8 juin 2026)

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
| 11 | Subscription status | ✅ | Format {success, data} corrigé |
| 12 | Images logo | ✅ | Placeholder au lieu de boucle 302 |
| 13 | Health check | ✅ | /api/health + /api/health/diagnostics |
| 14 | Recherche commerçants | ✅ | /api/commercants/search + /categories |
| 15 | Landing page | ✅ | Recherche, catégories, pricing |
| 16 | Badges clients | ✅ | 5 niveaux (1, 5, 10, 25, 50 pts) |
| 17 | Page installation | ✅ | QR code + bouton Google Wallet |

**17/17 features V1 = 100%** 🎉

## Sécurité

- ✅ JWT authentification (expiration 7 jours)
- ✅ Rate limiting (login 5/min, register 3/10min, scan 30/min)
- ✅ Validation des entrées (express-validator)
- ✅ Helmet (headers HTTP sécurisés)
- ✅ CORS configuré
- ✅ RLS Supabase
- ✅ Mots de passe forts requis (8+ chars, maj, min, chiffre)

## Déploiement

- **Backend** : Render (auto-deploy via GitHub)
- **Frontend** : Vercel (auto-deploy via GitHub)
- **CI/CD** : GitHub Actions
- **API Render** : Déclenchement auto via API

## Ce qui reste à faire

### Configuration manuelle (BOZO)
1. **Supabase** : Exécuter les migrations SQL (voir SETUP.md)
2. **FCM** : Ajouter la clé Firebase pour les notifications réelles
3. **Apple Wallet** : Certificat Apple Developer (V2)

### Features V2 (prochaines étapes)
- [ ] Apple Wallet (certificat Apple Developer)
- [ ] Application mobile commerçant
- [ ] Système de récompenses avancé (multi-niveaux)
- [ ] Programme parrainage client
- [ ] Intégration Google My Business
- [ ] Export CSV des données clients
- [ ] Multi-langues
- [ ] Thème sombre dashboard

## Commandes utiles

```bash
# Backend local
cd backend && npm install && npm run dev

# Frontend local  
cd frontend && npm install && npm run dev

# Tests API
python3 test_api.py

# Push vers GitHub (déclenche Render auto)
git add . && git commit -m "..." && git push origin main
```

## Support

Contact : BOZO sur Discord
