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

## Flux Complet (V1)

1. **Commerçant** s'inscrit → configure sa carte (template métier ou custom)
2. **Backend** crée la LoyaltyClass Google Wallet automatiquement
3. **Commerçant** génère un QR code → l'affiche en caisse
4. **Client** scanne le QR → page d'installation avec bouton "Ajouter à Google Wallet"
5. **Client** ajoute la carte à Google Wallet (1 clic, pas d'app)
6. **Client** scanne son QR code en caisse → crédité d'un point
7. **À 10 points** → notification de récompense débloquée
8. **Commerçant** peut envoyer des notifications push à ses clients

## Fonctionnalités Implémentées

### Côté Commerçant (Dashboard)
- [x] Inscription / Connexion (JWT)
- [x] Setup carte de fidélité (template métier : boulangerie, coiffeur, restaurant, kiné, garagiste)
- [x] Génération de cartes Google Wallet (URL "Ajouter à Google Wallet")
- [x] Scan QR en caisse (incrémentation points + rate limiting 30s)
- [x] Analytics (cartes installées, visites, notifications)
- [x] Gestion du profil (nom, téléphone, adresse)
- [x] Historique des scans

### Côté Client
- [x] Page d'installation avec détection OS (Android/iOS/Desktop)
- [x] Bouton "Ajouter à Google Wallet" (génère la carte en 1 clic)
- [x] QR code personnel à montrer en caisse
- [x] Suivi des points de fidélité

### Système
- [x] Google Wallet API (LoyaltyClass + save URLs)
- [x] Notifications push (mode simulation, prêt pour FCM)
- [x] Stripe (checkout + webhooks, prêt à configurer)
- [x] RGPD (données anonymes par défaut)

## Ce qui reste à faire

### Configuration manuelle (BOZO)
1. **Supabase** : Exécuter les migrations SQL (voir SETUP.md)
2. **Stripe** : Ajouter les clés API dans Render (voir SETUP.md)
3. **FCM** : Ajouter la clé Firebase pour les notifications réelles

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

# Push vers GitHub (déclenche Render auto)
git add . && git commit -m "..." && git push origin main
```

## Support

Contact : BOZO sur Discord
