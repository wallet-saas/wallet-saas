# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-ux.spec.js >> Boutons CTA >> Bouton "Commencer maintenant" mène quelque part
- Location: test-ux.spec.js:87:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: null
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e8]:
      - heading "Stamply" [level=1] [ref=e9]
      - generic [ref=e12]: Project
    - generic [ref=e41]:
      - navigation [ref=e42]:
        - generic [ref=e43]:
          - link "Stamply" [ref=e44] [cursor=pointer]:
            - /url: /
            - img [ref=e46]
            - generic [ref=e50]: Stamply
          - generic [ref=e51]:
            - link "Produit" [ref=e52] [cursor=pointer]:
              - /url: "#hero"
            - link "Fonctionnalités" [ref=e53] [cursor=pointer]:
              - /url: "#features"
            - link "Tarifs" [ref=e54] [cursor=pointer]:
              - /url: "#pricing"
          - generic [ref=e55]:
            - link "Connexion" [ref=e56] [cursor=pointer]:
              - /url: /login
            - link "Démarrer le projet" [ref=e57] [cursor=pointer]:
              - /url: /register
              - generic [ref=e59]: Démarrer le projet
      - main [ref=e60]:
        - generic [ref=e63]:
          - generic [ref=e64]:
            - generic [ref=e65]: "Nouveau : Intégration Apple & Google Wallet"
            - heading "La carte de fidélité de vos clients, dans leur téléphone" [level=1] [ref=e67]:
              - text: La carte de fidélité de vos clients,
              - text: dans leur téléphone
            - paragraph [ref=e68]: Fini le papier. Stamply génère une vraie carte Google Wallet & Apple Wallet en 2 minutes. Simplifiez la vie de vos clients et boostez votre rétention.
            - generic [ref=e69]:
              - link "Essayer gratuitement" [ref=e70] [cursor=pointer]:
                - /url: /register
                - text: Essayer gratuitement
                - img [ref=e71]
              - link "Voir la démo" [ref=e73] [cursor=pointer]:
                - /url: "#demo"
            - generic [ref=e74]:
              - generic [ref=e75]:
                - img [ref=e76]
                - generic [ref=e79]: Sans engagement
              - generic [ref=e80]:
                - img [ref=e81]
                - generic [ref=e84]: Configuration en 2 min
          - generic [ref=e87]:
            - generic:
              - generic:
                - generic:
                  - img
                - generic: +50 Pts
            - generic:
              - generic:
                - generic:
                  - img
                - generic: Récompense!
            - generic:
              - generic:
                - generic:
                  - img
                - generic: Niveau Or
            - generic [ref=e93]:
              - generic [ref=e96]:
                - generic [ref=e97]: Wallet
                - img [ref=e99]
              - img "Votre carte de fidélité digitale" [ref=e105] [cursor=pointer]
              - generic [ref=e106]:
                - generic [ref=e107]:
                  - paragraph [ref=e108]: Dernier passage
                  - paragraph [ref=e109]: Aujourd'hui, 14:32
                - img [ref=e111]
        - generic [ref=e114]:
          - generic [ref=e116]:
            - generic [ref=e118]: Rejoignez le mouvement
            - heading "Déjà adopté par plus de 500 commerçants" [level=2] [ref=e119]
          - generic [ref=e121]:
            - generic [ref=e122] [cursor=pointer]:
              - img [ref=e124]
              - generic [ref=e130]: Cafés
            - generic [ref=e131] [cursor=pointer]:
              - img [ref=e133]
              - generic [ref=e137]: Restaurants
            - generic [ref=e138] [cursor=pointer]:
              - img [ref=e140]
              - generic [ref=e146]: Salons de coiffure
            - generic [ref=e147] [cursor=pointer]:
              - img [ref=e149]
              - generic [ref=e152]: Boutiques
            - generic [ref=e153] [cursor=pointer]:
              - img [ref=e155]
              - generic [ref=e161]: Bars
            - generic [ref=e162] [cursor=pointer]:
              - img [ref=e164]
              - generic [ref=e172]: Salles de sport
            - generic [ref=e173] [cursor=pointer]:
              - img [ref=e175]
              - generic [ref=e180]: Concept Stores
            - generic [ref=e181] [cursor=pointer]:
              - img [ref=e183]
              - generic [ref=e187]: Instituts de beauté
            - generic [ref=e188] [cursor=pointer]:
              - img [ref=e190]
              - generic [ref=e196]: Cafés
            - generic [ref=e197] [cursor=pointer]:
              - img [ref=e199]
              - generic [ref=e203]: Restaurants
            - generic [ref=e204] [cursor=pointer]:
              - img [ref=e206]
              - generic [ref=e212]: Salons de coiffure
            - generic [ref=e213] [cursor=pointer]:
              - img [ref=e215]
              - generic [ref=e218]: Boutiques
            - generic [ref=e219] [cursor=pointer]:
              - img [ref=e221]
              - generic [ref=e227]: Bars
            - generic [ref=e228] [cursor=pointer]:
              - img [ref=e230]
              - generic [ref=e238]: Salles de sport
            - generic [ref=e239] [cursor=pointer]:
              - img [ref=e241]
              - generic [ref=e246]: Concept Stores
            - generic [ref=e247] [cursor=pointer]:
              - img [ref=e249]
              - generic [ref=e253]: Instituts de beauté
            - generic [ref=e254] [cursor=pointer]:
              - img [ref=e256]
              - generic [ref=e262]: Cafés
            - generic [ref=e263] [cursor=pointer]:
              - img [ref=e265]
              - generic [ref=e269]: Restaurants
            - generic [ref=e270] [cursor=pointer]:
              - img [ref=e272]
              - generic [ref=e278]: Salons de coiffure
            - generic [ref=e279] [cursor=pointer]:
              - img [ref=e281]
              - generic [ref=e284]: Boutiques
            - generic [ref=e285] [cursor=pointer]:
              - img [ref=e287]
              - generic [ref=e293]: Bars
            - generic [ref=e294] [cursor=pointer]:
              - img [ref=e296]
              - generic [ref=e304]: Salles de sport
            - generic [ref=e305] [cursor=pointer]:
              - img [ref=e307]
              - generic [ref=e312]: Concept Stores
            - generic [ref=e313] [cursor=pointer]:
              - img [ref=e315]
              - generic [ref=e319]: Instituts de beauté
        - generic [ref=e321]:
          - generic [ref=e322]:
            - generic [ref=e323]:
              - img [ref=e324]
              - text: Transition Technologique
            - heading "Du carton à la donnée pure." [level=2] [ref=e328]
            - paragraph [ref=e329]: Délaissez les systèmes archaïques. Entrez dans l'ère de la fidélité programmatique et maximisez la Life Time Value de chaque client.
          - generic [ref=e333]:
            - generic [ref=e335]:
              - generic [ref=e337]:
                - img [ref=e339]
                - generic [ref=e343]:
                  - heading "Système Legacy" [level=3] [ref=e344]
                  - generic [ref=e345]: CARTE_PAPIER_V1
              - generic [ref=e346]:
                - generic [ref=e347]:
                  - heading "Perte de données" [level=4] [ref=e348]
                  - paragraph [ref=e349]: Aucun traçage analytique possible. Les clients sont anonymes.
                - generic [ref=e350]:
                  - heading "Friction UX" [level=4] [ref=e351]
                  - paragraph [ref=e352]: Support physique requis. Oubli fréquent par l'utilisateur final.
                - generic [ref=e353]:
                  - heading "Coûts latents" [level=4] [ref=e354]
                  - paragraph [ref=e355]: Impressions récurrentes et logistique de distribution.
            - generic [ref=e357]:
              - generic [ref=e359]:
                - img [ref=e362]
                - generic [ref=e364]:
                  - heading "Protocole Stamply" [level=3] [ref=e365]
                  - generic [ref=e366]: WALLET_API_V2
              - generic [ref=e367]:
                - generic [ref=e368]:
                  - heading "Data Analytics native" [level=4] [ref=e369]
                  - paragraph [ref=e370]: Suivi en temps réel des cohortes, de la fréquence et du churn.
                - generic [ref=e371]:
                  - heading "Rétention OS-Level" [level=4] [ref=e372]
                  - paragraph [ref=e373]: Intégration profonde iOS/Android via notifications Push natives.
                - generic [ref=e374]:
                  - heading "Scalabilité infinie" [level=4] [ref=e375]
                  - paragraph [ref=e376]: 0 coût marginal par nouvel utilisateur. Déploiement instantané.
        - generic [ref=e378]:
          - generic [ref=e379]:
            - generic [ref=e380]:
              - img [ref=e381]
              - text: Architecture Next-Gen
            - heading "L'infrastructure de demain, dès aujourd'hui." [level=2] [ref=e384]:
              - text: L'infrastructure de demain,
              - text: dès aujourd'hui.
            - paragraph [ref=e385]: Une technologie de pointe condensée dans une interface ultra-simple. Stamply est pensé comme un outil SaaS B2B premium, robuste et évolutif.
          - generic [ref=e386]:
            - generic [ref=e387]:
              - img [ref=e390]
              - generic [ref=e393]:
                - heading "Intelligence & Analytics" [level=3] [ref=e394]
                - paragraph [ref=e395]: Analysez vos flux de clients en temps réel. Notre moteur de données vous permet de comprendre la rétention et d'optimiser vos campagnes de fidélité instantanément.
              - img [ref=e397]
            - generic [ref=e400]:
              - img [ref=e403]
              - generic [ref=e410]:
                - heading "Scan Cryptographique" [level=3] [ref=e411]
                - paragraph [ref=e412]: Validation en 0.8s via notre lecteur de QR intelligent. Fluidité totale en caisse.
            - generic [ref=e413]:
              - img [ref=e415]
              - heading "Identité Digitale" [level=3] [ref=e424]
              - paragraph [ref=e425]: Intégration native Apple Wallet & Google Pay.
            - generic [ref=e426]:
              - img [ref=e428]
              - heading "Sécurité Bancaire" [level=3] [ref=e431]
              - paragraph [ref=e432]: Infrastructure sécurisée et données chiffrées de bout en bout.
            - generic [ref=e433]:
              - generic [ref=e436]:
                - generic [ref=e437]: "{"
                - generic [ref=e438]: "\"theme\": \"dark\","
                - generic [ref=e439]: "\"accent\": \"#EC4899\","
                - generic [ref=e440]: "\"logo\": \"url(logo.png)\","
                - generic [ref=e441]: "\"points\": 1250,"
                - generic [ref=e442]: "\"status\": \"active\""
                - generic [ref=e443]: "}"
              - generic [ref=e444]:
                - img [ref=e446]
                - heading "API de Design" [level=3] [ref=e452]
                - paragraph [ref=e453]: Reprenez le contrôle de votre image de marque. Personnalisez chaque pixel de la carte de fidélité pour qu'elle s'intègre parfaitement à votre identité visuelle.
        - generic [ref=e455]:
          - generic [ref=e456]:
            - generic [ref=e458]:
              - img [ref=e459]
              - text: Espace Commerçant
            - heading "Gérez tout depuis votre Dashboard" [level=2] [ref=e461]
            - paragraph [ref=e462]: Une interface puissante pour analyser votre trafic, engager vos clients et personnaliser votre programme de fidélité.
          - generic [ref=e463]:
            - generic [ref=e464]:
              - generic [ref=e470]:
                - generic [ref=e471]: Vue d'ensemble
                - generic [ref=e472] [cursor=pointer]: Clients
                - generic [ref=e473] [cursor=pointer]: Campagnes
                - generic [ref=e474] [cursor=pointer]: Réglages
              - generic [ref=e475]:
                - generic [ref=e476]:
                  - img [ref=e477]
                  - generic [ref=e480]: Rechercher...
                - generic [ref=e481] [cursor=pointer]: JS
            - generic [ref=e482]:
              - generic [ref=e483]:
                - generic [ref=e484]:
                  - generic [ref=e485]:
                    - generic [ref=e487]:
                      - img [ref=e489]
                      - generic [ref=e494]:
                        - img [ref=e495]
                        - text: +12.5%
                    - generic [ref=e498]: 1,204
                    - generic [ref=e499]: Clients actifs
                  - generic [ref=e500]:
                    - generic [ref=e502]:
                      - img [ref=e504]
                      - generic [ref=e507]:
                        - img [ref=e508]
                        - text: +8.2%
                    - generic [ref=e511]: "458"
                    - generic [ref=e512]: Passages (30j)
                  - generic [ref=e513]:
                    - generic [ref=e515]:
                      - img [ref=e517]
                      - generic [ref=e521]:
                        - img [ref=e522]
                        - text: +24.1%
                    - generic [ref=e525]: "89"
                    - generic [ref=e526]: Récompenses
                - generic [ref=e527]:
                  - generic [ref=e528]:
                    - generic [ref=e529]:
                      - heading "Fréquentation" [level=3] [ref=e530]
                      - paragraph [ref=e531]: Visites des 30 derniers jours
                    - combobox [ref=e532]:
                      - option "30 derniers jours" [selected]
                      - option "7 derniers jours"
                      - option "Cette année"
                  - generic [ref=e533]:
                    - generic:
                      - generic: 40 visites
                    - generic:
                      - generic: 55 visites
                    - generic:
                      - generic: 45 visites
                    - generic:
                      - generic: 90 visites
                    - generic:
                      - generic: 65 visites
                    - generic:
                      - generic: 85 visites
                    - generic:
                      - generic: 120 visites
                    - generic:
                      - generic: 95 visites
                    - generic:
                      - generic: 110 visites
                    - generic:
                      - generic: 140 visites
                    - generic:
                      - generic: 100 visites
                    - generic:
                      - generic: 130 visites
                    - generic:
                      - generic: 80 visites
                    - generic:
                      - generic: 115 visites
                    - generic:
                      - generic: 75 visites
                    - generic:
                      - generic: 105 visites
                    - generic:
                      - generic: 125 visites
                    - generic:
                      - generic: 90 visites
                  - generic [ref=e534]:
                    - generic [ref=e535]: 1er Nov
                    - generic [ref=e536]: 15 Nov
                    - generic [ref=e537]: 30 Nov
                - generic [ref=e538]:
                  - generic [ref=e539]:
                    - heading "Activité Récente" [level=3] [ref=e540]
                    - generic [ref=e541] [cursor=pointer]: Voir tout
                  - generic [ref=e542]:
                    - generic [ref=e543] [cursor=pointer]:
                      - generic [ref=e544]:
                        - generic [ref=e545]: S
                        - generic [ref=e546]:
                          - generic [ref=e547]: Sophie Martin
                          - generic [ref=e548]: Nouveau scan • Il y a 5 min
                      - generic [ref=e549]: +10 pts
                    - generic [ref=e550] [cursor=pointer]:
                      - generic [ref=e551]:
                        - generic [ref=e552]: T
                        - generic [ref=e553]:
                          - generic [ref=e554]: Thomas Dubois
                          - generic [ref=e555]: Récompense utilisée • Il y a 22 min
                      - generic [ref=e556]: "-50 pts"
                    - generic [ref=e557] [cursor=pointer]:
                      - generic [ref=e558]:
                        - generic [ref=e559]: L
                        - generic [ref=e560]:
                          - generic [ref=e561]: Lucas Bernard
                          - generic [ref=e562]: Nouveau client • Il y a 1 heure
                      - generic [ref=e563]: Carte créée
              - generic [ref=e564]:
                - generic [ref=e565]:
                  - img [ref=e566]
                  - text: Votre Carte Digitale
                - generic [ref=e568]:
                  - generic [ref=e570]: Voir en taille réelle
                  - img "Aperçu de votre carte de fidélité" [ref=e571]
                - generic [ref=e572]:
                  - paragraph [ref=e573]: Actions rapides
                  - button "Générer un QR Code" [ref=e574] [cursor=pointer]:
                    - img [ref=e575]
                    - text: Générer un QR Code
                  - button "Envoyer une Push Notif" [ref=e581] [cursor=pointer]:
                    - img [ref=e582]
                    - text: Envoyer une Push Notif
                  - button "Modifier le design" [ref=e585] [cursor=pointer]:
                    - img [ref=e586]
                    - text: Modifier le design
        - generic [ref=e591]:
          - generic [ref=e592]:
            - heading "Comment ça marche ?" [level=2] [ref=e593]
            - paragraph [ref=e594]: Aussi simple pour vous que pour vos clients.
          - generic [ref=e595]:
            - generic [ref=e596]:
              - generic [ref=e597]: "01"
              - heading "Créez votre carte en 2 min" [level=3] [ref=e598]
              - paragraph [ref=e599]: Personnalisez les couleurs, ajoutez votre logo et définissez vos règles de fidélité depuis le dashboard.
            - generic [ref=e600]:
              - generic [ref=e601]: "02"
              - heading "Vos clients l'ajoutent" [level=3] [ref=e602]
              - paragraph [ref=e603]: Ils scannent un QR code sur votre comptoir et ajoutent la carte à leur Wallet en un clic. Pas d'app à télécharger.
            - generic [ref=e604]:
              - generic [ref=e605]: "03"
              - heading "Scannez et fidélisez" [level=3] [ref=e606]
              - paragraph [ref=e607]: À chaque visite, scannez leur carte avec votre téléphone pour ajouter des points automatiquement.
        - generic [ref=e609]:
          - generic [ref=e610]:
            - heading "Un tarif simple, sans surprise" [level=2] [ref=e611]
            - paragraph [ref=e612]: Tout ce dont vous avez besoin pour fidéliser vos clients, dans un seul abonnement. Rentabilisé dès les 5 premiers clients fidélisés.
          - generic [ref=e616]:
            - generic [ref=e617]:
              - img [ref=e618]
              - text: Offre Unique
            - heading "Plan Pro" [level=3] [ref=e620]
            - generic [ref=e621]:
              - generic [ref=e622]: 49€
              - generic [ref=e623]: / mois
            - paragraph [ref=e624]: Sans engagement. Annulez à tout moment.
            - button "Commencer maintenant" [ref=e625] [cursor=pointer]
            - generic [ref=e626]:
              - generic [ref=e627]:
                - img [ref=e629]
                - generic [ref=e632]: Création de carte personnalisée
              - generic [ref=e633]:
                - img [ref=e635]
                - generic [ref=e638]: Intégration Google Wallet & Apple Wallet
              - generic [ref=e639]:
                - img [ref=e641]
                - generic [ref=e644]: Scans et points illimités
              - generic [ref=e645]:
                - img [ref=e647]
                - generic [ref=e650]: Dashboard analytique
              - generic [ref=e651]:
                - img [ref=e653]
                - generic [ref=e656]: Base de données clients
              - generic [ref=e657]:
                - img [ref=e659]
                - generic [ref=e662]: Support par email 7j/7
        - generic [ref=e663]:
          - heading "Questions fréquentes" [level=2] [ref=e665]
          - generic [ref=e666]:
            - generic [ref=e667]:
              - button "Mes clients doivent-ils télécharger une application ?" [ref=e668] [cursor=pointer]:
                - generic [ref=e669]: Mes clients doivent-ils télécharger une application ?
                - img [ref=e670]
              - paragraph [ref=e673]: Non, c'est tout l'avantage ! La carte s'ajoute directement dans Apple Wallet ou Google Wallet, qui sont déjà installés sur 99% des smartphones.
            - generic [ref=e674]:
              - button "Comment je scanne les cartes de mes clients ?" [ref=e675] [cursor=pointer]:
                - generic [ref=e676]: Comment je scanne les cartes de mes clients ?
                - img [ref=e677]
              - paragraph [ref=e679]: Vous pouvez utiliser n'importe quel smartphone. Connectez-vous à votre espace Stamply depuis le navigateur de votre téléphone et utilisez notre scanner intégré en un clic.
            - generic [ref=e680]:
              - button "Est-ce que je peux changer le design de ma carte plus tard ?" [ref=e681] [cursor=pointer]:
                - generic [ref=e682]: Est-ce que je peux changer le design de ma carte plus tard ?
                - img [ref=e683]
              - paragraph [ref=e685]: Oui, vous pouvez modifier les couleurs, le logo ou les règles de fidélité à tout moment depuis votre dashboard. Les cartes de vos clients se mettront à jour automatiquement.
            - generic [ref=e686]:
              - button "Que se passe-t-il si je veux annuler mon abonnement ?" [ref=e687] [cursor=pointer]:
                - generic [ref=e688]: Que se passe-t-il si je veux annuler mon abonnement ?
                - img [ref=e689]
              - paragraph [ref=e691]: Stamply est sans engagement. Si vous annulez, les cartes de vos clients resteront actives jusqu'à la fin de votre période de facturation, puis elles expireront.
      - contentinfo [ref=e692]:
        - generic [ref=e693]:
          - generic [ref=e694]:
            - img [ref=e696]
            - generic [ref=e700]: Stamply
          - generic [ref=e701]:
            - link "Mentions légales" [ref=e702] [cursor=pointer]:
              - /url: "#"
            - link "CGV" [ref=e703] [cursor=pointer]:
              - /url: "#"
            - link "Confidentialité" [ref=e704] [cursor=pointer]:
              - /url: "#"
            - link "Contact" [ref=e705] [cursor=pointer]:
              - /url: "#"
          - generic [ref=e706]: © 2026 Stamply. Tous droits réservés.
  - alert [ref=e707]
```

# Test source

```ts
  1   | // ============================================================
  2   | // Stamply — Tests UX/Fonctionnels (Playwright)
  3   | // Mode: lecture seule, aucune modification
  4   | // ============================================================
  5   | 
  6   | const { test, expect } = require('@playwright/test');
  7   | 
  8   | const BASE_URL = 'https://stamply-gamma.vercel.app';
  9   | 
  10  | // ============================================================
  11  | // TESTS DE CHARGEMENT DES PAGES
  12  | // ============================================================
  13  | test.describe('Chargement des pages', () => {
  14  | 
  15  |   test('Page d\'accueil se charge', async ({ page }) => {
  16  |     const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  17  |     expect(response.status()).toBe(200);
  18  |     // Vérifier que la page n'est pas blanche
  19  |     const bodyText = await page.locator('body').innerText();
  20  |     expect(bodyText.length).toBeGreaterThan(100);
  21  |   });
  22  | 
  23  |   test('/login se charge sans erreur', async ({ page }) => {
  24  |     const response = await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  25  |     expect(response.status()).toBe(200);
  26  |     const bodyText = await page.locator('body').innerText();
  27  |     expect(bodyText.length).toBeGreaterThan(50);
  28  |   });
  29  | 
  30  |   test('/register se charge sans erreur', async ({ page }) => {
  31  |     const response = await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  32  |     expect(response.status()).toBe(200);
  33  |     const bodyText = await page.locator('body').innerText();
  34  |     expect(bodyText.length).toBeGreaterThan(50);
  35  |   });
  36  | 
  37  |   test('/mentions-legales se charge', async ({ page }) => {
  38  |     const response = await page.goto(`${BASE_URL}/mentions-legales`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  39  |     expect(response.status()).toBe(200);
  40  |   });
  41  | 
  42  |   test('/cgu se charge', async ({ page }) => {
  43  |     const response = await page.goto(`${BASE_URL}/cgu`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  44  |     expect(response.status()).toBe(200);
  45  |   });
  46  | 
  47  |   test('/politique-confidentialite se charge', async ({ page }) => {
  48  |     const response = await page.goto(`${BASE_URL}/politique-confidentialite`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  49  |     expect(response.status()).toBe(200);
  50  |   });
  51  | 
  52  |   test('/contact se charge', async ({ page }) => {
  53  |     const response = await page.goto(`${BASE_URL}/contact`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  54  |     expect(response.status()).toBe(200);
  55  |   });
  56  | });
  57  | 
  58  | // ============================================================
  59  | // TESTS DES BOUTONS CTA
  60  | // ============================================================
  61  | test.describe('Boutons CTA', () => {
  62  | 
  63  |   test('Bouton "Voir la démo" mène quelque part', async ({ page }) => {
  64  |     await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  65  |     const demoBtn = page.locator('a, button').filter({ hasText: /démo|demo/i }).first();
  66  |     if (await demoBtn.count() > 0) {
  67  |       const href = await demoBtn.getAttribute('href');
  68  |       expect(href).toBeTruthy();
  69  |       console.log(`  → "Voir la démo" → ${href}`);
  70  |     } else {
  71  |       console.log('  → Pas de bouton "Voir la démo" trouvé (skip)');
  72  |     }
  73  |   });
  74  | 
  75  |   test('Bouton "Essayer gratuitement" mène quelque part', async ({ page }) => {
  76  |     await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  77  |     const tryBtn = page.locator('a, button').filter({ hasText: /essayer|gratuit|try/i }).first();
  78  |     if (await tryBtn.count() > 0) {
  79  |       const href = await tryBtn.getAttribute('href');
  80  |       expect(href).toBeTruthy();
  81  |       console.log(`  → "Essayer gratuitement" → ${href}`);
  82  |     } else {
  83  |       console.log('  → Pas de bouton "Essayer gratuitement" trouvé (skip)');
  84  |     }
  85  |   });
  86  | 
  87  |   test('Bouton "Commencer maintenant" mène quelque part', async ({ page }) => {
  88  |     await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  89  |     const startBtn = page.locator('a, button').filter({ hasText: /commencer|commencer maintenant|start/i }).first();
  90  |     if (await startBtn.count() > 0) {
  91  |       const href = await startBtn.getAttribute('href');
> 92  |       expect(href).toBeTruthy();
      |                    ^ Error: expect(received).toBeTruthy()
  93  |       console.log(`  → "Commencer maintenant" → ${href}`);
  94  |     } else {
  95  |       console.log('  → Pas de bouton "Commencer maintenant" trouvé (skip)');
  96  |     }
  97  |   });
  98  | 
  99  |   test('Bouton "Connexion" mène à /login', async ({ page }) => {
  100 |     await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  101 |     const loginBtn = page.locator('a, button').filter({ hasText: /connexion|login|se connecter/i }).first();
  102 |     if (await loginBtn.count() > 0) {
  103 |       await loginBtn.click();
  104 |       await page.waitForLoadState('domcontentloaded');
  105 |       const url = page.url();
  106 |       expect(url).toContain('/login');
  107 |       console.log(`  → "Connexion" → ${url}`);
  108 |     } else {
  109 |       console.log('  → Pas de bouton "Connexion" trouvé (skip)');
  110 |     }
  111 |   });
  112 | });
  113 | 
  114 | // ============================================================
  115 | // TESTS RESPONSIVE
  116 | // ============================================================
  117 | test.describe('Responsive', () => {
  118 | 
  119 |   test('Page d\'accueil sur mobile (375px)', async ({ page }) => {
  120 |     await page.setViewportSize({ width: 375, height: 812 });
  121 |     await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  122 |     const bodyText = await page.locator('body').innerText();
  123 |     expect(bodyText.length).toBeGreaterThan(50);
  124 |     // Vérifier pas de scroll horizontal
  125 |     const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  126 |     const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  127 |     expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  128 |   });
  129 | 
  130 |   test('Page d\'accueil sur desktop (1280px)', async ({ page }) => {
  131 |     await page.setViewportSize({ width: 1280, height: 720 });
  132 |     await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  133 |     const bodyText = await page.locator('body').innerText();
  134 |     expect(bodyText.length).toBeGreaterThan(50);
  135 |   });
  136 | 
  137 |   test('/login sur mobile', async ({ page }) => {
  138 |     await page.setViewportSize({ width: 375, height: 812 });
  139 |     await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  140 |     const bodyText = await page.locator('body').innerText();
  141 |     expect(bodyText.length).toBeGreaterThan(30);
  142 |   });
  143 | });
  144 | 
  145 | // ============================================================
  146 | // TESTS D'ERREURS RÉSEAU
  147 | // ============================================================
  148 | test.describe('Erreurs réseau', () => {
  149 | 
  150 |   test('Pas d\'erreur "Failed to fetch" au chargement', async ({ page }) => {
  151 |     const errors = [];
  152 |     page.on('console', msg => {
  153 |       if (msg.type() === 'error') {
  154 |         errors.push(msg.text());
  155 |       }
  156 |     });
  157 |     page.on('requestfailed', request => {
  158 |       errors.push(`Request failed: ${request.url()} — ${request.failure().errorText}`);
  159 |     });
  160 | 
  161 |     await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  162 |     await page.waitForTimeout(2000);
  163 | 
  164 |     const fetchErrors = errors.filter(e => e.toLowerCase().includes('failed to fetch') || e.toLowerCase().includes('networkerror'));
  165 |     if (fetchErrors.length > 0) {
  166 |       console.log('  → Erreurs fetch détectées:');
  167 |       fetchErrors.forEach(e => console.log(`     ${e}`));
  168 |     }
  169 |     expect(fetchErrors.length).toBe(0);
  170 |   });
  171 | });
  172 | 
```