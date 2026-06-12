# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-ux.spec.js >> Boutons CTA >> Bouton "Connexion" mène à /login
- Location: test-ux.spec.js:99:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('a, button').filter({ hasText: /connexion|login|se connecter/i }).first()
    - locator resolved to <a href="/login" class="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block px-4">Connexion</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
      - waiting 100ms
    54 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - element is outside of the viewport
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - link "Stamply" [ref=e6] [cursor=pointer]:
          - /url: /
          - img [ref=e8]
          - generic [ref=e12]: Stamply
        - generic [ref=e13]:
          - link "Produit" [ref=e14] [cursor=pointer]:
            - /url: "#hero"
          - link "Fonctionnalités" [ref=e15] [cursor=pointer]:
            - /url: "#features"
          - link "Tarifs" [ref=e16] [cursor=pointer]:
            - /url: "#pricing"
        - generic [ref=e17]:
          - link "Connexion" [ref=e18] [cursor=pointer]:
            - /url: /login
          - link "Démarrer le projet" [ref=e19] [cursor=pointer]:
            - /url: /register
            - generic [ref=e21]: Démarrer le projet
    - main [ref=e22]:
      - generic [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]: "Nouveau : Intégration Apple & Google Wallet"
          - heading "La carte de fidélité de vos clients, dans leur téléphone" [level=1] [ref=e29]:
            - text: La carte de fidélité de vos clients,
            - text: dans leur téléphone
          - paragraph [ref=e30]: Fini le papier. Stamply génère une vraie carte Google Wallet & Apple Wallet en 2 minutes. Simplifiez la vie de vos clients et boostez votre rétention.
          - generic [ref=e31]:
            - link "Essayer gratuitement" [ref=e32] [cursor=pointer]:
              - /url: /register
              - text: Essayer gratuitement
              - img [ref=e33]
            - link "Voir la démo" [ref=e35] [cursor=pointer]:
              - /url: "#demo"
          - generic [ref=e36]:
            - generic [ref=e37]:
              - img [ref=e38]
              - generic [ref=e41]: Sans engagement
            - generic [ref=e42]:
              - img [ref=e43]
              - generic [ref=e46]: Configuration en 2 min
        - generic [ref=e49]:
          - generic [ref=e51]:
            - img [ref=e53]
            - generic [ref=e55]: +50 Pts
          - generic [ref=e57]:
            - img [ref=e59]
            - generic [ref=e63]: Récompense!
          - generic [ref=e65]:
            - img [ref=e67]
            - generic [ref=e70]: Niveau Or
          - generic [ref=e76]:
            - generic [ref=e79]:
              - generic [ref=e80]: Wallet
              - img [ref=e82]
            - img "Votre carte de fidélité digitale" [ref=e88] [cursor=pointer]
            - generic [ref=e89]:
              - generic [ref=e90]:
                - paragraph [ref=e91]: Dernier passage
                - paragraph [ref=e92]: Aujourd'hui, 14:32
              - img [ref=e94]
      - generic [ref=e97]:
        - generic [ref=e99]:
          - generic [ref=e101]: Rejoignez le mouvement
          - heading "Déjà adopté par plus de 500 commerçants" [level=2] [ref=e102]
        - generic [ref=e104]:
          - generic [ref=e105] [cursor=pointer]:
            - img [ref=e107]
            - generic [ref=e113]: Cafés
          - generic [ref=e114] [cursor=pointer]:
            - img [ref=e116]
            - generic [ref=e120]: Restaurants
          - generic [ref=e121] [cursor=pointer]:
            - img [ref=e123]
            - generic [ref=e129]: Salons de coiffure
          - generic [ref=e130] [cursor=pointer]:
            - img [ref=e132]
            - generic [ref=e135]: Boutiques
          - generic [ref=e136] [cursor=pointer]:
            - img [ref=e138]
            - generic [ref=e144]: Bars
          - generic [ref=e145] [cursor=pointer]:
            - img [ref=e147]
            - generic [ref=e155]: Salles de sport
          - generic [ref=e156] [cursor=pointer]:
            - img [ref=e158]
            - generic [ref=e163]: Concept Stores
          - generic [ref=e164] [cursor=pointer]:
            - img [ref=e166]
            - generic [ref=e170]: Instituts de beauté
          - generic [ref=e171] [cursor=pointer]:
            - img [ref=e173]
            - generic [ref=e179]: Cafés
          - generic [ref=e180] [cursor=pointer]:
            - img [ref=e182]
            - generic [ref=e186]: Restaurants
          - generic [ref=e187] [cursor=pointer]:
            - img [ref=e189]
            - generic [ref=e195]: Salons de coiffure
          - generic [ref=e196] [cursor=pointer]:
            - img [ref=e198]
            - generic [ref=e201]: Boutiques
          - generic [ref=e202] [cursor=pointer]:
            - img [ref=e204]
            - generic [ref=e210]: Bars
          - generic [ref=e211] [cursor=pointer]:
            - img [ref=e213]
            - generic [ref=e221]: Salles de sport
          - generic [ref=e222] [cursor=pointer]:
            - img [ref=e224]
            - generic [ref=e229]: Concept Stores
          - generic [ref=e230] [cursor=pointer]:
            - img [ref=e232]
            - generic [ref=e236]: Instituts de beauté
          - generic [ref=e237] [cursor=pointer]:
            - img [ref=e239]
            - generic [ref=e245]: Cafés
          - generic [ref=e246] [cursor=pointer]:
            - img [ref=e248]
            - generic [ref=e252]: Restaurants
          - generic [ref=e253] [cursor=pointer]:
            - img [ref=e255]
            - generic [ref=e261]: Salons de coiffure
          - generic [ref=e262] [cursor=pointer]:
            - img [ref=e264]
            - generic [ref=e267]: Boutiques
          - generic [ref=e268] [cursor=pointer]:
            - img [ref=e270]
            - generic [ref=e276]: Bars
          - generic [ref=e277] [cursor=pointer]:
            - img [ref=e279]
            - generic [ref=e287]: Salles de sport
          - generic [ref=e288] [cursor=pointer]:
            - img [ref=e290]
            - generic [ref=e295]: Concept Stores
          - generic [ref=e296] [cursor=pointer]:
            - img [ref=e298]
            - generic [ref=e302]: Instituts de beauté
      - generic [ref=e304]:
        - generic [ref=e305]:
          - generic [ref=e306]:
            - img [ref=e307]
            - text: Transition Technologique
          - heading "Du carton à la donnée pure." [level=2] [ref=e311]
          - paragraph [ref=e312]: Délaissez les systèmes archaïques. Entrez dans l'ère de la fidélité programmatique et maximisez la Life Time Value de chaque client.
        - generic [ref=e316]:
          - generic [ref=e318]:
            - generic [ref=e320]:
              - img [ref=e322]
              - generic [ref=e326]:
                - heading "Système Legacy" [level=3] [ref=e327]
                - generic [ref=e328]: CARTE_PAPIER_V1
            - generic [ref=e329]:
              - generic [ref=e330]:
                - heading "Perte de données" [level=4] [ref=e331]
                - paragraph [ref=e332]: Aucun traçage analytique possible. Les clients sont anonymes.
              - generic [ref=e333]:
                - heading "Friction UX" [level=4] [ref=e334]
                - paragraph [ref=e335]: Support physique requis. Oubli fréquent par l'utilisateur final.
              - generic [ref=e336]:
                - heading "Coûts latents" [level=4] [ref=e337]
                - paragraph [ref=e338]: Impressions récurrentes et logistique de distribution.
          - generic [ref=e340]:
            - generic [ref=e342]:
              - img [ref=e345]
              - generic [ref=e347]:
                - heading "Protocole Stamply" [level=3] [ref=e348]
                - generic [ref=e349]: WALLET_API_V2
            - generic [ref=e350]:
              - generic [ref=e351]:
                - heading "Data Analytics native" [level=4] [ref=e352]
                - paragraph [ref=e353]: Suivi en temps réel des cohortes, de la fréquence et du churn.
              - generic [ref=e354]:
                - heading "Rétention OS-Level" [level=4] [ref=e355]
                - paragraph [ref=e356]: Intégration profonde iOS/Android via notifications Push natives.
              - generic [ref=e357]:
                - heading "Scalabilité infinie" [level=4] [ref=e358]
                - paragraph [ref=e359]: 0 coût marginal par nouvel utilisateur. Déploiement instantané.
      - generic [ref=e361]:
        - generic [ref=e362]:
          - generic [ref=e363]:
            - img [ref=e364]
            - text: Architecture Next-Gen
          - heading "L'infrastructure de demain, dès aujourd'hui." [level=2] [ref=e367]:
            - text: L'infrastructure de demain,
            - text: dès aujourd'hui.
          - paragraph [ref=e368]: Une technologie de pointe condensée dans une interface ultra-simple. Stamply est pensé comme un outil SaaS B2B premium, robuste et évolutif.
        - generic [ref=e369]:
          - generic [ref=e370]:
            - img [ref=e373]
            - generic [ref=e376]:
              - heading "Intelligence & Analytics" [level=3] [ref=e377]
              - paragraph [ref=e378]: Analysez vos flux de clients en temps réel. Notre moteur de données vous permet de comprendre la rétention et d'optimiser vos campagnes de fidélité instantanément.
            - img [ref=e380]
          - generic [ref=e383]:
            - img [ref=e386]
            - generic [ref=e393]:
              - heading "Scan Cryptographique" [level=3] [ref=e394]
              - paragraph [ref=e395]: Validation en 0.8s via notre lecteur de QR intelligent. Fluidité totale en caisse.
          - generic [ref=e396]:
            - img [ref=e398]
            - heading "Identité Digitale" [level=3] [ref=e407]
            - paragraph [ref=e408]: Intégration native Apple Wallet & Google Pay.
          - generic [ref=e409]:
            - img [ref=e411]
            - heading "Sécurité Bancaire" [level=3] [ref=e414]
            - paragraph [ref=e415]: Infrastructure sécurisée et données chiffrées de bout en bout.
          - generic [ref=e416]:
            - generic [ref=e419]:
              - generic [ref=e420]: "{"
              - generic [ref=e421]: "\"theme\": \"dark\","
              - generic [ref=e422]: "\"accent\": \"#EC4899\","
              - generic [ref=e423]: "\"logo\": \"url(logo.png)\","
              - generic [ref=e424]: "\"points\": 1250,"
              - generic [ref=e425]: "\"status\": \"active\""
              - generic [ref=e426]: "}"
            - generic [ref=e427]:
              - img [ref=e429]
              - heading "API de Design" [level=3] [ref=e435]
              - paragraph [ref=e436]: Reprenez le contrôle de votre image de marque. Personnalisez chaque pixel de la carte de fidélité pour qu'elle s'intègre parfaitement à votre identité visuelle.
      - generic [ref=e438]:
        - generic [ref=e439]:
          - generic [ref=e441]:
            - img [ref=e442]
            - text: Espace Commerçant
          - heading "Gérez tout depuis votre Dashboard" [level=2] [ref=e444]
          - paragraph [ref=e445]: Une interface puissante pour analyser votre trafic, engager vos clients et personnaliser votre programme de fidélité.
        - generic [ref=e446]:
          - generic [ref=e447]:
            - generic [ref=e453]:
              - generic [ref=e454]: Vue d'ensemble
              - generic [ref=e455] [cursor=pointer]: Clients
              - generic [ref=e456] [cursor=pointer]: Campagnes
              - generic [ref=e457] [cursor=pointer]: Réglages
            - generic [ref=e458]:
              - generic [ref=e459]:
                - img [ref=e460]
                - generic [ref=e463]: Rechercher...
              - generic [ref=e464] [cursor=pointer]: JS
          - generic [ref=e465]:
            - generic [ref=e466]:
              - generic [ref=e467]:
                - generic [ref=e468]:
                  - generic [ref=e470]:
                    - img [ref=e472]
                    - generic [ref=e477]:
                      - img [ref=e478]
                      - text: +12.5%
                  - generic [ref=e481]: 1,204
                  - generic [ref=e482]: Clients actifs
                - generic [ref=e483]:
                  - generic [ref=e485]:
                    - img [ref=e487]
                    - generic [ref=e490]:
                      - img [ref=e491]
                      - text: +8.2%
                  - generic [ref=e494]: "458"
                  - generic [ref=e495]: Passages (30j)
                - generic [ref=e496]:
                  - generic [ref=e498]:
                    - img [ref=e500]
                    - generic [ref=e504]:
                      - img [ref=e505]
                      - text: +24.1%
                  - generic [ref=e508]: "89"
                  - generic [ref=e509]: Récompenses
              - generic [ref=e510]:
                - generic [ref=e511]:
                  - generic [ref=e512]:
                    - heading "Fréquentation" [level=3] [ref=e513]
                    - paragraph [ref=e514]: Visites des 30 derniers jours
                  - combobox [ref=e515]:
                    - option "30 derniers jours" [selected]
                    - option "7 derniers jours"
                    - option "Cette année"
                - generic [ref=e516]:
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
                - generic [ref=e517]:
                  - generic [ref=e518]: 1er Nov
                  - generic [ref=e519]: 15 Nov
                  - generic [ref=e520]: 30 Nov
              - generic [ref=e521]:
                - generic [ref=e522]:
                  - heading "Activité Récente" [level=3] [ref=e523]
                  - generic [ref=e524] [cursor=pointer]: Voir tout
                - generic [ref=e525]:
                  - generic [ref=e526] [cursor=pointer]:
                    - generic [ref=e527]:
                      - generic [ref=e528]: S
                      - generic [ref=e529]:
                        - generic [ref=e530]: Sophie Martin
                        - generic [ref=e531]: Nouveau scan • Il y a 5 min
                    - generic [ref=e532]: +10 pts
                  - generic [ref=e533] [cursor=pointer]:
                    - generic [ref=e534]:
                      - generic [ref=e535]: T
                      - generic [ref=e536]:
                        - generic [ref=e537]: Thomas Dubois
                        - generic [ref=e538]: Récompense utilisée • Il y a 22 min
                    - generic [ref=e539]: "-50 pts"
                  - generic [ref=e540] [cursor=pointer]:
                    - generic [ref=e541]:
                      - generic [ref=e542]: L
                      - generic [ref=e543]:
                        - generic [ref=e544]: Lucas Bernard
                        - generic [ref=e545]: Nouveau client • Il y a 1 heure
                    - generic [ref=e546]: Carte créée
            - generic [ref=e547]:
              - generic [ref=e548]:
                - img [ref=e549]
                - text: Votre Carte Digitale
              - generic [ref=e551]:
                - generic [ref=e553]: Voir en taille réelle
                - img "Aperçu de votre carte de fidélité" [ref=e554]
              - generic [ref=e555]:
                - paragraph [ref=e556]: Actions rapides
                - button "Générer un QR Code" [ref=e557] [cursor=pointer]:
                  - img [ref=e558]
                  - text: Générer un QR Code
                - button "Envoyer une Push Notif" [ref=e564] [cursor=pointer]:
                  - img [ref=e565]
                  - text: Envoyer une Push Notif
                - button "Modifier le design" [ref=e568] [cursor=pointer]:
                  - img [ref=e569]
                  - text: Modifier le design
      - generic [ref=e574]:
        - generic [ref=e575]:
          - heading "Comment ça marche ?" [level=2] [ref=e576]
          - paragraph [ref=e577]: Aussi simple pour vous que pour vos clients.
        - generic [ref=e578]:
          - generic [ref=e579]:
            - generic [ref=e580]: "01"
            - heading "Créez votre carte en 2 min" [level=3] [ref=e581]
            - paragraph [ref=e582]: Personnalisez les couleurs, ajoutez votre logo et définissez vos règles de fidélité depuis le dashboard.
          - generic [ref=e583]:
            - generic [ref=e584]: "02"
            - heading "Vos clients l'ajoutent" [level=3] [ref=e585]
            - paragraph [ref=e586]: Ils scannent un QR code sur votre comptoir et ajoutent la carte à leur Wallet en un clic. Pas d'app à télécharger.
          - generic [ref=e587]:
            - generic [ref=e588]: "03"
            - heading "Scannez et fidélisez" [level=3] [ref=e589]
            - paragraph [ref=e590]: À chaque visite, scannez leur carte avec votre téléphone pour ajouter des points automatiquement.
      - generic [ref=e592]:
        - generic [ref=e593]:
          - heading "Un tarif simple, sans surprise" [level=2] [ref=e594]
          - paragraph [ref=e595]: Tout ce dont vous avez besoin pour fidéliser vos clients, dans un seul abonnement. Rentabilisé dès les 5 premiers clients fidélisés.
        - generic [ref=e599]:
          - generic [ref=e600]:
            - img [ref=e601]
            - text: Offre Unique
          - heading "Plan Pro" [level=3] [ref=e603]
          - generic [ref=e604]:
            - generic [ref=e605]: 49€
            - generic [ref=e606]: / mois
          - paragraph [ref=e607]: Sans engagement. Annulez à tout moment.
          - button "Commencer maintenant" [ref=e608] [cursor=pointer]
          - generic [ref=e609]:
            - generic [ref=e610]:
              - img [ref=e612]
              - generic [ref=e615]: Création de carte personnalisée
            - generic [ref=e616]:
              - img [ref=e618]
              - generic [ref=e621]: Intégration Google Wallet & Apple Wallet
            - generic [ref=e622]:
              - img [ref=e624]
              - generic [ref=e627]: Scans et points illimités
            - generic [ref=e628]:
              - img [ref=e630]
              - generic [ref=e633]: Dashboard analytique
            - generic [ref=e634]:
              - img [ref=e636]
              - generic [ref=e639]: Base de données clients
            - generic [ref=e640]:
              - img [ref=e642]
              - generic [ref=e645]: Support par email 7j/7
      - generic [ref=e646]:
        - heading "Questions fréquentes" [level=2] [ref=e648]
        - generic [ref=e649]:
          - generic [ref=e650]:
            - button "Mes clients doivent-ils télécharger une application ?" [ref=e651] [cursor=pointer]:
              - generic [ref=e652]: Mes clients doivent-ils télécharger une application ?
              - img [ref=e653]
            - paragraph [ref=e656]: Non, c'est tout l'avantage ! La carte s'ajoute directement dans Apple Wallet ou Google Wallet, qui sont déjà installés sur 99% des smartphones.
          - generic [ref=e657]:
            - button "Comment je scanne les cartes de mes clients ?" [ref=e658] [cursor=pointer]:
              - generic [ref=e659]: Comment je scanne les cartes de mes clients ?
              - img [ref=e660]
            - paragraph [ref=e662]: Vous pouvez utiliser n'importe quel smartphone. Connectez-vous à votre espace Stamply depuis le navigateur de votre téléphone et utilisez notre scanner intégré en un clic.
          - generic [ref=e663]:
            - button "Est-ce que je peux changer le design de ma carte plus tard ?" [ref=e664] [cursor=pointer]:
              - generic [ref=e665]: Est-ce que je peux changer le design de ma carte plus tard ?
              - img [ref=e666]
            - paragraph [ref=e668]: Oui, vous pouvez modifier les couleurs, le logo ou les règles de fidélité à tout moment depuis votre dashboard. Les cartes de vos clients se mettront à jour automatiquement.
          - generic [ref=e669]:
            - button "Que se passe-t-il si je veux annuler mon abonnement ?" [ref=e670] [cursor=pointer]:
              - generic [ref=e671]: Que se passe-t-il si je veux annuler mon abonnement ?
              - img [ref=e672]
            - paragraph [ref=e674]: Stamply est sans engagement. Si vous annulez, les cartes de vos clients resteront actives jusqu'à la fin de votre période de facturation, puis elles expireront.
    - contentinfo [ref=e675]:
      - generic [ref=e676]:
        - generic [ref=e677]:
          - img [ref=e679]
          - generic [ref=e683]: Stamply
        - generic [ref=e684]:
          - link "Mentions légales" [ref=e685] [cursor=pointer]:
            - /url: "#"
          - link "CGV" [ref=e686] [cursor=pointer]:
            - /url: "#"
          - link "Confidentialité" [ref=e687] [cursor=pointer]:
            - /url: "#"
          - link "Contact" [ref=e688] [cursor=pointer]:
            - /url: "#"
        - generic [ref=e689]: © 2026 Stamply. Tous droits réservés.
  - alert [ref=e690]
```

# Test source

```ts
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
  92  |       expect(href).toBeTruthy();
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
> 103 |       await loginBtn.click();
      |                      ^ Error: locator.click: Test timeout of 60000ms exceeded.
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