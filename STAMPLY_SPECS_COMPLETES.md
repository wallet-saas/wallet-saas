# 🃏 **STAMPLY — Spécifications Complètes du Projet**

> **Document de référence unique** fusionnant toutes les specs techniques, architecture, schéma Supabase et roadmap de développement.

---

## 📋 **Table des matières**

1. [Concept Produit](#concept-produit)
2. [Cible Client](#cible-client)
3. [Proposition de Valeur](#proposition-de-valeur)
4. [Fonctionnalités Produit](#fonctionnalités-produit)
5. [Templates par Métier](#templates-par-métier)
6. [Analytics & Tracking](#analytics--tracking)
7. [Architecture Technique](#architecture-technique)
8. [Schéma Base de Données Supabase](#schéma-base-de-données-supabase)
9. [Système de Scan QR](#système-de-scan-qr)
10. [Modèle Tarifaire](#modèle-tarifaire)
11. [Roadmap de Développement](#roadmap-de-développement)
12. [Points RGPD](#points-rgpd)
13. [Infrastructure & Comptes](#infrastructure--comptes)

---

## 🎯 **Concept Produit**

SaaS B2B ciblant les TPE/PME françaises (coiffeurs, restaurateurs, kinés, boulangers, garagistes, artisans...).

### **3 briques principales :**

1. **Carte de fidélité digitale** installée dans Apple Wallet / Google Wallet via QR code (sans app à télécharger)
2. **Notifications push gratuites et illimitées** envoyées directement sur le téléphone des clients via la carte wallet
3. **Dashboard commerçant** avec analytics, gestion des points, avis Google et notifications

### **Fonctionnalités avancées (modules optionnels) :**
- **Géolocalisation "client proche"** : Notification automatique quand un client passe à moins de 200m du commerce
- **Avis Google automatisés** : Demande d'avis via notification push + réponses IA suggérées
- **Menu du jour / Produits** : Publication quotidienne visible sur la carte wallet
- **Offres flash** : Bons de réduction envoyés par notification push

---

## 👤 **Cible Client**

- **Profil** : TPE/PME françaises
- **Secteurs** : Coiffeurs, restaurateurs, kinés, boulangers, garagistes, artisans
- **Marché adressable** : ~5 millions de micro-entreprises + TPE en France
- **Canal d'acquisition** : Cold calling
- **Problème** : Pas de solution simple pour fidéliser sans app mobile coûteuse
- **Prix cible** : **49€/mois** + 50€ one-shot pour personnalisation sur mesure

---

## 🔑 **Proposition de Valeur**

> "Installez une carte de fidélité dans le téléphone de vos clients en 10 minutes. Envoyez-leur des offres en 30 secondes. Collectez des avis Google automatiquement. Zéro application à télécharger."

### **Différenciateurs clés :**
- ✅ **Zéro friction client** : Pas d'app à télécharger, installation en 5 secondes via QR code
- ✅ **Notifications push gratuites** : Via Apple/Google Wallet (pas de Firebase, pas de serveur APNS)
- ✅ **Anonymat par défaut** : Pas de nom/email requis (UUID uniquement, RGPD-friendly)
- ✅ **Templates métier** : Configuration pré-faite pour chaque secteur d'activité
- ✅ **Module avis Google** : Automatisation de la collecte + réponses IA

---

## ⚙️ **Fonctionnalités Produit**

### **Côté client final (porteur de carte)**

- Scan d'un QR code en caisse → carte installée dans Apple Wallet ou Google Wallet en 5 secondes
- Pas de compte à créer, pas d'app à télécharger
- Reçoit les notifications push du commerçant directement sur son écran de verrouillage
- Accumule des points de fidélité visibles en temps réel sur la carte
- **Notification push automatique** après installation (délai configurable) demandant un avis Google
- **Notification de proximité** : Reçoit une alerte quand il passe à moins de 200m du commerce (si module activé)

### **Côté commerçant (dashboard web + app mobile future)**

#### **Fonctionnalités de base (toujours actives)**
- Tableau de bord web responsive (fonctionne sur mobile et desktop)
- Génération de cartes wallet avec QR code
- Scan QR en caisse pour créditer des points (1 visite = 1 point par défaut)
- Envoi de notifications push manuelles (rédaction + envoi immédiat)
- Personnalisation esthétique de la carte (couleurs, logo via URL)

#### **Modules optionnels (activables/désactivables)**
1. **Module Fidélité** :
   - Gestion du nb de passages (= points de fidélité)
   - Configuration du seuil de récompense (ex: 10 points = 1 café offert)

2. **Module Avis Google** :
   - Notification push envoyée X minutes après installation de la carte
   - Redirection intelligente : clients satisfaits → fiche Google, clients insatisfaits → formulaire privé
   - Visualisation des avis Google reçus
   - Suggestions de réponses pré-rédigées validables en 1 clic

3. **Module Géolocalisation** :
   - Notification automatique quand un client porteur de carte passe à moins de 200m
   - Configuration du rayon de détection (par défaut 200m)
   - Message personnalisable (ex: "Vous passez par là ? Café offert aujourd'hui")

4. **Module Menu du Jour / Produits** :
   - Publication quotidienne de menus, plats du jour, produits disponibles
   - Visible directement sur la carte wallet du client

5. **Module Offres Flash** :
   - Création de bons de réduction
   - Envoi par notification push ciblée
   - Tracking du taux d'utilisation

#### **Automatisations disponibles**
- Notification push récurrente (tous les X jours/semaines)
- Relance automatique des clients dormants (pas vus depuis 30 jours)
- Demande d'avis Google après première visite

---

## 🎨 **Templates par Métier**

Modèles pré-configurés inclus dans l'abonnement, avec modules optionnels pré-sélectionnés selon le métier :

| Métier | Modules activés par défaut | Couleurs | Fonctionnalités spécifiques |
|--------|----------------------------|----------|----------------------------|
| 🍞 **Boulanger** | Fidélité, Offres Flash, Menu du Jour | Beige/Marron | Produits du jour, Pain offert à 10 points |
| ✂️ **Coiffeur / Beauté** | Fidélité, Avis Google, Géolocalisation | Rose/Violet | Rappel RDV, Coupe offerte à 5 visites |
| 🍽️ **Restaurateur** | Fidélité, Avis Google, Menu du Jour | Rouge/Orange | Plat du jour, Dessert offert à 10 points |
| 💆 **Kiné / Santé** | Fidélité, Avis Google | Bleu/Blanc | Séance offerte à 10 visites |
| 🚗 **Garagiste / Carrossier** | Fidélité, Avis Google | Gris/Noir | Vidange offerte à 5 visites |

**Option personnalisation sur mesure** : +50€ one-shot (logo custom, couleurs spécifiques, fonctionnalités à la carte).

---

## 📊 **Analytics & Tracking Clients**

Données trackées et affichées dans le dashboard commerçant :

### **Métriques de base**
- Nombre de cartes wallet installées (courbe d'évolution dans le temps)
- Taux d'ouverture des notifications push envoyées
- Fréquence de visite par client
- Clients actifs vs clients dormants (pas vus depuis X jours configurables)

### **Alertes intelligentes**
- **Alerte "clients à risque"** : Clients n'ayant pas visité depuis 30 jours → relance automatique suggérée
- **Taux de conversion** : Notifications push → Visites effectives

### **Modules spécifiques**
- **Module Avis Google** : Nombre d'avis générés via la plateforme, évolution dans le temps
- **Module Offres Flash** : Taux d'utilisation des bons de réduction (combien ont utilisé le bon)
- **Module Géolocalisation** : Taux de conversion (notifications de proximité → visites)

---

## 🗄️ **Architecture Technique**

### **Stack Technologique**

| Composant | Technologie | Environnement |
|-----------|-------------|---------------|
| **Backend** | Node.js v22.13.1 + Express | Windows (dev), Railway (prod) |
| **Base de données** | PostgreSQL via Supabase | Cloud |
| **Frontend dashboard** | Next.js + Tailwind CSS + shadcn/ui | Vercel |
| **Cartes wallet** | passkit-generator (npm) | Serveur backend |
| **Authentification** | JWT + bcrypt | Backend |
| **Paiements** | Stripe (webhooks) | Backend + Frontend |
| **Hébergement backend** | Railway | Production |
| **Hébergement frontend** | Vercel | Production |
| **Certificats Apple** | .pem (signerCert, signerKey, wwdr) | Backend /certificates/ |

### **Ports et URLs**
- **Backend local** : `http://localhost:3000`
- **Frontend local** : `http://localhost:3001`
- **Backend prod** : `https://<railway-url>.up.railway.app` (à définir)
- **Frontend prod** : `https://<vercel-url>.vercel.app` (à définir)

### **Certificats Apple Wallet (mode réel)**

Fichiers requis dans `backend/certificates/` :
- `signerCert.pem` (certificat Pass Type ID)
- `signerKey.pem` (clé privée)
- `wwdr.pem` (certificat Apple Worldwide Developer Relations)
- `pass.model/pass.json` (template de carte)

Variables `.env` requises :
```env
APPLE_TEAM_ID=<Team ID Apple Developer>
```

**Note** : En mode simulation (développement sans certificats), les cartes sont générées au format JSON et non .pkpass.

---

## 📊 **Schéma Base de Données Supabase**

### **Table `commercants`**

Stocke les informations des commerçants inscrits.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identifiant unique |
| `email` | varchar | UNIQUE, NOT NULL | Email de connexion |
| `password` | text | NOT NULL | Mot de passe hashé (bcrypt) |
| `nom_enseigne` | varchar | NOT NULL | Nom du commerce |
| `telephone` | varchar | NULL | Téléphone du commerce |
| `adresse` | varchar | NULL | Adresse complète |
| `ville` | varchar | NULL | Ville |
| `code_postal` | varchar | NULL | Code postal |
| `latitude` | numeric | NULL | Latitude GPS |
| `longitude` | numeric | NULL | Longitude GPS |
| `google_place_id` | varchar | NULL | ID Google My Business |
| `template_metier` | varchar | DEFAULT 'generique' | Template choisi (boulanger, coiffeur, etc.) |
| `module_fidelite` | bool | DEFAULT true | Module fidélité activé |
| `module_avis_google` | bool | DEFAULT false | Module avis Google activé |
| `module_geolocalisation` | bool | DEFAULT false | Module géolocalisation activé |
| `module_menu_jour` | bool | DEFAULT false | Module menu du jour activé |
| `module_offres_flash` | bool | DEFAULT false | Module offres flash activé |
| `carte_couleur_primaire` | varchar | DEFAULT '#5856D6' | Couleur principale carte (hex) |
| `carte_couleur_secondaire` | varchar | DEFAULT '#FFFFFF' | Couleur secondaire carte (hex) |
| `carte_logo_url` | text | NULL | URL du logo (hébergé externe) |
| `stripe_customer_id` | varchar | NULL | ID client Stripe |
| `stripe_subscription_id` | varchar | NULL | ID abonnement Stripe |
| `abonnement_statut` | varchar | DEFAULT 'actif' | Statut : actif, suspendu, annule |
| `abonnement_debut` | timestamptz | NULL | Date début abonnement |
| `abonnement_fin` | timestamptz | NULL | Date fin abonnement |
| `delai_notif_avis_minutes` | int4 | DEFAULT 60 | Délai avant envoi notif avis (minutes) |
| `rayon_geoloc_metres` | int4 | DEFAULT 200 | Rayon géolocalisation (mètres) |
| `points_par_visite` | int4 | DEFAULT 1 | Points gagnés par visite |
| `points_recompense` | int4 | DEFAULT 10 | Points requis pour récompense |
| `created_at` | timestamptz | DEFAULT now() | Date création compte |
| `updated_at` | timestamptz | DEFAULT now() | Date dernière modification |
| `qr_code_install_url` | texte | NULL | Date dernière modification |
| `google_place_url` | texte | NULL | Date dernière modification |
---

### **Table `cartes`**

Stocke chaque carte wallet générée.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identifiant unique |
| `commercant_id` | uuid | FOREIGN KEY → commercants(id) | Commerçant propriétaire |
| `pass_type` | varchar | NULL | Type de pass (storeCard par défaut) |
| `pass_serial_number` | varchar | UNIQUE, NOT NULL | UUID unique de la carte (contenu QR code) |
| `pass_url` | text | NULL | URL d'installation (générée) |
| `qr_code_url` | text | NULL | URL du QR code (si généré en externe) |
| `design_json` | jsonb | NULL | Design personnalisé (JSON) |
| `actif` | bool | DEFAULT true | Carte active ou désactivée |
| `points` | int4 | DEFAULT 0, NOT NULL | Points de fidélité accumulés |
| `last_visit_at` | timestamptz | NULL | Date dernière visite |
| `created_at` | timestamptz | DEFAULT now() | Date génération carte |
| `updated_at` | timestamptz | DEFAULT now() | Date dernière modification |
| `avis_notif_sent` | bool | false | Date dernière modification |
| `last_geoloc_notif_at` | timestamptz | NULL | Date dernière modification |
| `google_wallet_url` | text | NULL | Date dernière modification |
| `apple_wallet_url` | text | NULL | Date dernière modification |
| `installed_at` | timestamptz | NULL | Date dernière modification |


---

### **Table `clients`**

Stocke les clients porteurs de carte (optionnel, si device token nécessaire).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identifiant unique |
| `commercant_id` | uuid | FOREIGN KEY → commercants(id) | Commerçant |
| `carte_id` | uuid | FOREIGN KEY → cartes(id) | Carte associée |
| `device_token` | varchar | NULL | Token device (pour notifs push) |
| `platform` | varchar | NULL | iOS ou Android |
| `points_fidelite` | int4 | DEFAULT 0 | Points de fidélité du client |
| `nombre_visites` | int4 | DEFAULT 0 | Nombre total de visites |
| `derniere_visite` | timestamptz | NULL | Date dernière visite |
| `statut` | varchar | DEFAULT 'actif' | Statut : actif, dormant, inactif |
| `consentement_rgpd` | bool | DEFAULT false | Consentement RGPD accepté |
| `consentement_geoloc` | bool | DEFAULT false | Consentement géolocalisation accepté |
| `consentement_date` | timestamptz | NULL | Date consentement |
| `created_at` | timestamptz | DEFAULT now() | Date création |
| `updated_at` | timestamptz | DEFAULT now() | Date dernière modification |

---

### **Table `visites`**

Enregistre chaque scan QR / passage client.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identifiant unique |
| `client_id` | uuid | FOREIGN KEY → clients(id), NULL | Client (si identifié) |
| `commercant_id` | uuid | FOREIGN KEY → commercants(id) | Commerçant |
| `points_gagnes` | int4 | DEFAULT 1 | Points gagnés lors de la visite |
| `source` | varchar | DEFAULT 'scan' | Source : scan, manuel, auto |
| `created_at` | timestamptz | DEFAULT now() | Date/heure du scan |

---

### **Table `notifications`**

Historique des notifications push envoyées.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identifiant unique |
| `commercant_id` | uuid | FOREIGN KEY → commercants(id) | Commerçant émetteur |
| `titre` | varchar | NULL | Titre de la notification |
| `message` | text | NULL | Contenu du message |
| `type` | varchar | DEFAULT 'push' | Type : push, sms, email |
| `cible` | varchar | DEFAULT 'tous' | Cible : tous, actifs, dormants |
| `total_envoyes` | int4 | DEFAULT 0 | Nombre de destinataires |
| `total_ouverts` | int4 | DEFAULT 0 | Nombre d'ouvertures trackées |
| `planifiee_pour` | timestamptz | NULL | Date planification (si différée) |
| `envoyee` | bool | DEFAULT false | Envoi effectué ou non |
| `created_at` | timestamptz | DEFAULT now() | Date création |

---

### **Table `avis`**

Avis Google collectés via la plateforme.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identifiant unique |
| `commercant_id` | uuid | FOREIGN KEY → commercants(id) | Commerçant concerné |
| `client_id` | uuid | FOREIGN KEY → clients(id), NULL | Client auteur (si identifié) |
| `source` | varchar | DEFAULT 'google' | Source : google, formulaire_prive |
| `note` | int4 | NULL | Note sur 5 |
| `contenu` | text | NULL | Texte de l'avis |
| `reponse_suggeree` | text | NULL | Réponse IA suggérée |
| `reponse_envoyee` | text | NULL | Réponse réellement envoyée |
| `reponse_validee` | bool | DEFAULT false | Réponse validée par commerçant |
| `google_review_id` | varchar | NULL | ID Google de l'avis |
| `created_at` | timestamptz | DEFAULT now() | Date création |

---

### **Table `menus`**

Menu du jour / produits disponibles (module optionnel).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, DEFAULT uuid_generate_v4() | Identifiant unique |
| `commercant_id` | uuid | FOREIGN KEY → commercants(id) | Commerçant propriétaire |
| `titre` | varchar | NULL | Nom du plat/produit |
| `description` | text | NULL | Description détaillée |
| `prix` | numeric | NULL | Prix en euros |
| `categorie` | varchar | NULL | Catégorie (entrée, plat, dessert, etc.) |
| `disponible` | bool | DEFAULT true | Disponible aujourd'hui |
| `image_url` | text | NULL | URL de l'image (hébergée externe) |
| `created_at` | timestamptz | DEFAULT now() | Date création |
| `updated_at` | timestamptz | DEFAULT now() | Date dernière modification |

---

## 📷 **Système de Scan QR**

### **Concept**

Chaque carte wallet client contient un **QR code unique** (identifiant UUID = `pass_serial_number`).  
Le commerçant scanne ce QR depuis **notre application web** (caméra téléphone ou tablette en caisse).  
Le scan crédite instantanément **+1 point / +1 passage** sans aucune saisie manuelle.

**Zéro friction côté client** : Pas de compte, pas de nom à renseigner, pas d'app à télécharger.  
**Zéro friction côté commerçant** : Ouvre l'app, scanne, c'est crédité.

---

### **Flow Complet**

```
[Client] Scan QR d'installation (affiché en caisse)
    ↓
Carte installée dans Apple/Google Wallet (anonyme, UUID généré)
    ↓
Aucun nom / email requis à ce stade

[Commerçant] Ouvre l'app de scan sur son téléphone/tablette
    ↓
Pointe la caméra sur la carte wallet du client
    ↓
Scan du QR code unique de la carte
    ↓
Backend : +1 visite enregistrée en base (table visites)
    ↓
Carte du client mise à jour en temps réel (points visibles sur la carte)
    ↓
Notification push optionnelle : "Merci pour votre visite ! Vous avez X points."
```

---

### **Structure de la Carte Wallet (PassKit)**

```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "pass.com.stamply.loyalty",
  "serialNumber": "uuid-v4-unique-par-carte",
  "teamIdentifier": "TEAM_ID_APPLE",
  "organizationName": "Nom du commerce",
  "description": "Carte de fidélité",
  
  "backgroundColor": "#5856D6",
  "foregroundColor": "#FFFFFF",
  "labelColor": "#FFFFFF",
  
  "storeCard": {
    "primaryFields": [
      {
        "key": "points",
        "label": "POINTS",
        "value": 0
      }
    ],
    "secondaryFields": [
      {
        "key": "commerce",
        "label": "CHEZ",
        "value": "Nom du commerce"
      },
      {
        "key": "reward",
        "label": "PROCHAIN CADEAU",
        "value": "À 10 points"
      }
    ],
    "backFields": [
      {
        "key": "terms",
        "label": "Conditions",
        "value": "Cumulez 1 point par visite. 10 points = 1 récompense offerte."
      }
    ]
  },
  
  "barcode": {
    "message": "uuid-v4-unique-par-carte",
    "format": "PKBarcodeFormatQR",
    "messageEncoding": "iso-8859-1"
  }
}
```

- Le `serialNumber` = UUID unique = contenu du QR code = `pass_serial_number` en base
- Aucun nom client dans la carte (anonyme par défaut, RGPD friendly)
- Les `primaryFields` (points) sont mis à jour dynamiquement via mise à jour de la carte

---

### **API Backend — Endpoint de Scan**

#### **`POST /api/scan`**

**Corps de la requête :**
```json
{
  "pass_serial_number": "uuid-de-la-carte-scannée",
  "commercant_id": "uuid-du-commerçant"
}
```

**Logique serveur :**
1. Vérifier que la carte appartient bien à ce commerçant
2. Incrémenter `cartes.points` + 1
3. Mettre à jour `cartes.last_visit_at` = NOW()
4. Insérer une ligne dans `visites` (client_id NULL si anonyme, commercant_id, points_gagnes=1, source='scan')
5. Appeler l'API de mise à jour de la carte wallet (via PassKit ou notification push)
6. Retourner les nouveaux points

**Réponse :**
```json
{
  "success": true,
  "points": 7,
  "message": "Visite enregistrée !"
}
```

**Sécurité :**
- Endpoint protégé par JWT (le commerçant doit être authentifié)
- **Rate limiting** : Max 1 scan par carte toutes les 30 secondes (anti-double scan accidentel)

---

### **App de Scan Côté Commerçant**

Interface web responsive (fonctionne sur mobile, tablette, desktop).  
Pas d'app native à installer — accessible depuis le dashboard commerçant.

#### **Fonctionnement**
- Bouton "Scanner une carte" dans le dashboard
- Ouverture de la caméra via `getUserMedia()` (API navigateur standard)
- Lecture QR code via la librairie **`jsQR`** ou **`@zxing/library`** (légères, open-source, gratuites)
- Appel automatique à `POST /api/scan` avec le `pass_serial_number` extrait du QR
- Affichage du résultat en overlay : Nom du programme, nouveaux points, animation de confirmation
- Retour automatique en mode scan (prêt pour le client suivant)

#### **UI de Scan (États)**

```
[En attente]  → Viseur caméra actif, instructions "Pointez sur la carte du client"
[Scan réussi] → Flash vert + "✓ 7 points — Merci !" (2 secondes)
[Erreur]      → Flash rouge + "Carte non reconnue" (carte d'un autre commerce, etc.)
[Doublon]     → Flash orange + "Déjà scanné récemment" (protection anti-double)
```

---

### **Anonymat & RGPD**

- La carte est créée **sans nom ni email** à l'installation
- Le `pass_serial_number` est un identifiant technique (UUID), non lié à une identité
- Le commerçant voit uniquement : Nb de visites, points, date dernière visite
- Le client peut demander la suppression depuis un lien dans sa carte wallet
- Si le commerçant veut associer un nom à une carte → **Fonctionnalité optionnelle** (le client saisit son prénom dans une page web liée à la carte, pas obligatoire)

---

## 💰 **Modèle Tarifaire**

| Plan | Prix | Inclus |
|------|------|--------|
| **Starter** (unique plan) | **49€/mois** | Tous les modules activables/désactivables inclus |
| **Personnalisation** (optionnel) | **+50€ one-shot** | Logo custom, couleurs spécifiques, design sur mesure |

### **Stratégie de lancement**
- Afficher un faux prix barré (ex: ~~79€~~ → **49€/mois**) avec mention "Offre de lancement première année"
- Paiement mensuel via Stripe
- Pas de frais cachés, pas de commission sur transactions

---

## 🚀 **Roadmap de Développement**

### **Phase 1 — MVP Core (Priorité Absolue) ✅ EN COURS**

- [x] Backend Node.js + Express configuré
- [x] Authentification JWT commerçants (register/login/me)
- [x] Connexion Supabase PostgreSQL
- [x] Table `commercants` créée et opérationnelle
- [x] Génération de carte wallet (mode simulation sans certificats Apple)
- [ ] Page d'installation client (scan QR → carte dans wallet)
- [ ] Dashboard commerçant basique (web responsive)
- [ ] Endpoint `POST /api/scan` (scan QR + crédit points)
- [ ] Système de points de fidélité simple (incrémentation automatique)
- [ ] Templates pour 2 métiers (restaurateur + coiffeur)

---

### **Phase 2A — Authentification Commerçant ✅ TERMINÉ**

- [x] Endpoint `POST /api/auth/register`
- [x] Endpoint `POST /api/auth/login`
- [x] Endpoint `GET /api/auth/me` (protected)
- [x] Middleware `authMiddleware.js` (vérification JWT)
- [x] Schéma Supabase aligné avec code (colonne `nom_enseigne`, `password`, etc.)

---

### **Phase 2B — Génération Cartes Wallet ✅ TERMINÉ (MODE SIMULATION)**

- [x] Service `walletService.js` (génération JSON simulée)
- [x] Controller `walletController.js` (generateWalletCard, getInstallPage, downloadPass, getCommercantCards)
- [x] Routes `/api/wallet/generate`, `/api/wallet/install/:serial`, `/api/wallet/download/:serial`, `/api/wallet/cards`
- [x] Schéma Supabase table `cartes` aligné (`pass_serial_number`, `points`, `last_visit_at`)
- [ ] **À faire** : Certificats Apple réels pour générer .pkpass (migration future)

---

### **Phase 2C — Scan QR + Points (EN COURS)**

- [ ] Endpoint `POST /api/scan` avec rate limiting (1 scan / 30 sec par carte)
- [ ] Mise à jour `cartes.points` + insertion `visites`
- [ ] Mise à jour `cartes.last_visit_at`
- [ ] Interface de scan caméra dans le dashboard (utilisation de jsQR ou @zxing/library)
- [ ] Animation de confirmation post-scan
- [ ] Historique des visites par carte dans le dashboard

---

### **Phase 2D — Notifications Push**

- [ ] Endpoint `POST /api/notifications/send` (envoi manuel depuis dashboard)
- [ ] Stockage historique dans table `notifications`
- [ ] Envoi via Apple Push Notification Service (APNS) pour iOS
- [ ] Envoi via Firebase Cloud Messaging (FCM) pour Android
- [ ] Tracking taux d'ouverture (callback webhook)

---

### **Phase 3 — Modules Optionnels & Analytics**

#### **Module Avis Google**
- [ ] Automatisation : Détection première installation carte
- [ ] Envoi notification push demande d'avis (après X minutes configurables)
- [ ] Redirection intelligente : Satisfait (≥4/5) → Google, Insatisfait → formulaire privé
- [ ] Intégration Google My Business API pour lire les avis reçus
- [ ] Génération IA de réponses suggérées (via Anthropic API)
- [ ] Validation en 1 clic par le commerçant

#### **Module Géolocalisation**
- [ ] Déclenchement notification automatique quand client à moins de 200m
- [ ] Configuration rayon détection par commerçant
- [ ] Message personnalisable ("Vous passez par là ? Café offert")
- [ ] Consentement géolocalisation explicite du client

#### **Module Menu du Jour / Produits**
- [ ] Interface publication menu du jour
- [ ] Affichage sur carte wallet client
- [ ] CRUD table `menus`

#### **Module Offres Flash**
- [ ] Création bons de réduction
- [ ] Envoi par notification push ciblée
- [ ] Tracking taux d'utilisation

#### **Analytics Dashboard**
- [ ] Dashboard analytics complet (courbes d'évolution)
- [ ] Alertes clients dormants + relance automatique suggérée
- [ ] Métriques par module (avis Google, géoloc, offres flash)
- [ ] Templates pour 3 métiers supplémentaires (kiné, boulanger, garagiste)

---

### **Phase 4 — Paiements Stripe & Croissance**

- [ ] Intégration Stripe Checkout (page paiement abonnement 49€/mois)
- [ ] Webhook Stripe pour renouvellements automatiques
- [ ] Gestion abonnement dans dashboard (upgrade, downgrade, annulation)
- [ ] Application mobile commerçant (React Native)
- [ ] Multi-enseignes (gestion de plusieurs commerces sous un compte)
- [ ] Programme de parrainage commerçants

---

## ⚖️ **Points RGPD Importants**

- Le commerçant est **responsable de traitement**, le SaaS (Stamply) est **sous-traitant**
- **Consentement client** collecté à l'installation de la carte wallet
- Clause de sous-traitance dans le contrat commerçant (DPA - Data Processing Agreement)
- **Droit de suppression des données** accessible depuis la carte wallet (lien dans backFields)
- Pour le **module géolocalisation** : Consentement de localisation explicite requis à l'installation de la carte
- **Anonymat par défaut** : Aucun nom/email stocké, uniquement UUID (RGPD-friendly)
- Données stockées sur serveurs Supabase (UE)

---

## 🔐 **Infrastructure & Comptes**

### **GitHub**
- Repository : `https://github.com/wallet-saas/wallet-saas` (privé)
- Email : `jules.gerber2@gmail.com`
- Username : `wallet-saas`

### **Supabase (PostgreSQL)**
- Dashboard : `https://supabase.com/dashboard`
- Email : `jules.gerber2@gmail.com`
- URL : `https://oouknqnwptunfjlbtkfp.supabase.co`
- Service Role Key : (voir `.env`)

### **Stripe (Paiements)**
- Dashboard : `https://dashboard.stripe.com`
- Email : `jules.gerber2@gmail.com`
- Mode TEST actif (clés `sk_test_...` et `pk_test_...`)

### **Vercel (Frontend Next.js)**
- Dashboard : `https://vercel.com/dashboard`
- Connexion via GitHub SSO
- Root directory : `frontend`

### **Railway (Backend Node.js)**
- Dashboard : `https://railway.app/dashboard`
- Connexion via GitHub SSO
- Root directory : `backend`

### **Certificats Apple (Future)**
- Team ID : À récupérer sur developer.apple.com
- Certificats : `signerCert.pem`, `signerKey.pem`, `wwdr.pem`
- Pass Type ID : `pass.com.stamply.loyalty`

---

## 📝 **Variables d'Environnement Backend**

Fichier `.env` (backend) :

```env
# Supabase
SUPABASE_URL=https://oouknqnwptunfjlbtkfp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<voir infrastructure.md>

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=8f3a9d2e7c1b6f4a0e5d8c3b9a2f7e1d4c6b8a3f9e2d7c1b6a5f4e3d2c1b0a9f

# Stripe (MODE TEST)
STRIPE_SECRET_KEY=sk_test_51TH3VBBKYSAVWllTna6cG9v3SX67t3Ta87yXMZKDWAUP5Up56dRJXAIE0MpeocB6fvXyzfrlhLVQeiHY6mASZQEg00Upq0Hokq
STRIPE_PUBLISHABLE_KEY=pk_test_51TH3VBBKYSAVWllTGKFdV3SzvXvRwiseQ0A9DNFTRLpQTRtbce8t4p7EiSyAFj5s1qM2AM2fBSNgKSKI0Tvb6VH100QzTpK9OF

# Frontend
FRONTEND_URL=http://localhost:3001

# Apple Wallet (à ajouter en mode réel)
# APPLE_TEAM_ID=<Team ID>
```

---

## 🎯 **État Actuel du Projet**

### **✅ Terminé**
- Phase 2A : Authentification JWT commerçants
- Phase 2B : Génération cartes wallet (mode simulation)
- Structure backend MVC complète
- Connexion Supabase opérationnelle
- Schéma base de données aligné avec code

### **🔨 En cours**
- Phase 2C : Scan QR + Points (endpoint `/api/scan`)

### **⏳ À venir**
- Phase 2D : Notifications push
- Phase 3 : Modules optionnels (avis Google, géoloc, menu, offres)
- Phase 4 : Stripe webhooks + Frontend Next.js

---

**📅 Dernière mise à jour** : 6 avril 2026  
**👤 Maintenu par** : Jules (jules.gerber2@gmail.com)
