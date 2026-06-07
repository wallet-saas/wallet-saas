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

## État des Features (testé en live le 7 juin 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| Auth (register/login/me) | ✅ | JWT 7 jours, bcrypt |
| Google Wallet (setup → generate → URL) | ✅ | LoyaltyClass auto-créée |
| Scan QR caisse | ✅ | Rate limiting 30s, points auto |
| Notifications push | ✅ | Mode simulation (FCM prêt) |
| Offres flash | ✅ | CRUD + envoi notif |
| Analytics | ✅ | Charts + stats |
| Menus | ✅ | CRUD complet |
| Avis | ✅ | List + réponse IA |
| Géolocalisation | ✅ | Stats + trigger |
| Stripe checkout | ✅ | Code prêt, clés à configurer |
| Subscription status | ⚠️ | Corrigé en local, pas déployé |
| Images logo | ⚠️ | Corrigé en local, pas déployé |

## Sécurité

- ✅ JWT authentification (expiration 7 jours)
- ✅ Rate limiting (login 5/min, register 3/10min, scan 30/min)
- ✅ Validation des entrées (express-validator)
- ✅ Helmet (headers HTTP sécurisés)
- ✅ CORS configuré
- ✅ RLS Supabase
- ✅ Mots de passe forts requis (8+ chars, maj, min, chiffre)

## Ce qui reste à faire

### Configuration manuelle (BOZO)
1. **Supabase** : Exécuter les migrations SQL (voir SETUP.md)
2. **Stripe** : Ajouter les clés API dans Render (voir SETUP.md)
3. **FCM** : Ajouter la clé Firebase pour les notifications réelles
4. **Render** : Vérifier que le déploiement a bien eu lieu

### Features V2 (prochaines étapes)
- [ ] Module Avis Google (automatisation collecte + réponses IA)
- [ ] Module Géolocalisation (notification client proche)
- [ ] Module Menu du Jour
- [ ] Module Offres Flash
- [ ] Apple Wallet (certificat Apple Developer)
- [ ] Application mobile commerçant
- [ ] Système de récompenses avancé
- [ ] Multi-langues

## Commandes utiles

```bash
# Backend local
cd backend && npm install && npm run dev

# Frontend local  
cd frontend && npm install && npm run dev

# Tests API
python3 test_api.py

# Push vers GitHub (déclenche Render auto)
git add . && git commit -m "..." && git push origin master
```

## Support

Contact : BOZO sur Discord
