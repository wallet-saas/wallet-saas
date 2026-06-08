# 📱 Guide d'installation Stamply — App Mobile

Stamply est une **PWA (Progressive Web App)**, ce qui signifie qu'elle fonctionne comme une application native sur Android et iOS, sans passer par l'App Store ou Google Play.

---

## 🤖 Android — Installation

### Méthode 1 : "Ajouter à l'écran d'accueil" (recommandé)
1. Ouvrez **Chrome** sur votre téléphone
2. Allez sur **https://stamply-gamma.vercel.app**
3. Appuyez sur le **menu ⋮** (en haut à droite)
4. Appuyez sur **"Ajouter à l'écran d'accueil"** ou **"Installer l'application"**
5. Confirmez → L'icône Stamply apparaît sur votre écran d'accueil

### Méthode 2 : Via le navigateur
1. Ouvrez Chrome
2. Allez sur l'URL
3. Une bannière d'installation apparaît automatiquement en bas de l'écran
4. Appuyez sur **"Installer"**

### Méthode 3 : Publier sur Google Play Store (optionnel)
Pour publier sur le Play Store, il faut :
1. **Créer un compte Google Play Developer** (25$ une fois)
2. **Générer un APK** via Bubblewrap ou PWABuilder :
   ```bash
   # Via PWABuilder (en ligne, gratuit)
   # Allez sur https://www.pwabuilder.com/
   # Entrez l'URL de la PWA
   # Téléchargez le package Android
   ```
3. **Soumettre l'application** via la console Google Play

---

## 🍎 iOS — Installation

### Méthode 1 : "Ajouter à l'écran d'accueil"
1. Ouvrez **Safari** sur votre iPhone/iPad
2. Allez sur **https://stamply-gamma.vercel.app**
3. Appuyez sur le **bouton Partager** (carré avec flèche)
4. Appuyez sur **"Sur l'écran d'accueil"**
5. Confirmez → L'icône Stamply apparaît

### Méthode 2 : Publier sur l'App Store (optionnel)
Pour publier sur l'App Store, il faut :
1. **Apple Developer Program** (99$/an)
2. **Xcode** sur Mac pour compiler
3. **Transporter** pour soumettre l'application
4. Utiliser **PWABuilder** ou **Capacitor** pour wrapper la PWA

---

## 📋 Checklist technique pour la PWA

### ✅ Déjà fait
- [x] Manifest web app (nom, icônes, couleurs, mode d'affichage)
- [x] Service worker (cache, offline, background sync)
- [x] HTTPS (Vercel le fournit automatiquement)
- [x] Responsive design (mobile-first)
- [x] Install prompt (détection + bannière d'installation)

### 🔧 À améliorer
- [ ] Icônes haute résolution (192x192, 512x512)
- [ ] Splash screen personnalisée
- [ ] Push notifications (nécessite FCM)
- [ ] Mode offline complet
- [ ] Raccourcis d'application (App Shortcuts)

---

## 🚀 Publication sur les stores (résumé)

| Store | Coût | Difficulté | Délai |
|-------|------|------------|-------|
| Google Play | 25$ (une fois) | Moyenne | 1-7 jours |
| Apple App Store | 99$/an | Élevée | 1-14 jours |
| PWA (direct) | Gratuit | Facile | Immédiat |

**Recommandation :** Commencer avec la PWA (gratuit, immédiat). Publier sur les stores seulement quand le produit est validé et qu'on a des utilisateurs.

---

## 📱 Compatibilité

| Fonctionnalité | Android | iOS |
|----------------|---------|-----|
| Installation PWA | ✅ Chrome, Edge, Samsung | ✅ Safari |
| Push notifications | ✅ Chrome | ⚠️ iOS 16.4+ (limité) |
| Mode offline | ✅ | ✅ |
| Ajout écran accueil | ✅ | ✅ |
| GPS/Geolocalisation | ✅ | ✅ |
| Appareil photo (scan QR) | ✅ | ✅ |
| Google Wallet | ✅ | ❌ (Apple Wallet uniquement) |
| Apple Wallet | ❌ | ✅ |
