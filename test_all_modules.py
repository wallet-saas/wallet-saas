#!/usr/bin/env python3
"""
STAMPLY - Diagnostic complet modules v4
========================================
"""
import requests
import json
import time
import sys
from datetime import datetime

BACKEND = "https://stamply-backend-gn8z.onrender.com"
FRONTEND = "https://stamply-gamma.vercel.app"

PASS = 0
FAIL = 0
WARN = 0
RESULTS = []
TOKEN = None
COMMERCANT_ID = None
CARD_ID = None

def log(msg): print(msg)
def pass_(msg):
    global PASS; PASS += 1; RESULTS.append(f"PASS: {msg}"); log(f"  [PASS] {msg}")
def fail_(msg):
    global FAIL; FAIL += 1; RESULTS.append(f"FAIL: {msg}"); log(f"  [FAIL] {msg}")
def warn_(msg):
    global WARN; WARN += 1; RESULTS.append(f"WARN: {msg}"); log(f"  [WARN] {msg}")
def info(msg): log(f"  [INFO] {msg}")
def sep(): log("-" * 50)

def auth_h():
    if TOKEN:
        return {"Authorization": "Bearer " + TOKEN}
    return {"Authorization": "Bearer NONE"}

def post(path, data, auth=True):
    h = {"Content-Type": "application/json"}
    if auth: h.update(auth_h())
    try:
        r = requests.post(f"{BACKEND}{path}", json=data, headers=h, timeout=15)
        return r.status_code, r.json() if r.headers.get('content-type','').startswith('application/json') else r.text
    except Exception as e:
        return 0, str(e)

def get(path, auth=True):
    h = {}
    if auth: h.update(auth_h())
    try:
        r = requests.get(f"{BACKEND}{path}", headers=h, timeout=15)
        return r.status_code, r.json() if r.headers.get('content-type','').startswith('application/json') else r.text
    except Exception as e:
        return 0, str(e)

def put(path, data, auth=True):
    h = {"Content-Type": "application/json"}
    if auth: h.update(auth_h())
    try:
        r = requests.put(f"{BACKEND}{path}", json=data, headers=h, timeout=15)
        return r.status_code, r.json() if r.headers.get('content-type','').startswith('application/json') else r.text
    except Exception as e:
        return 0, str(e)

def fe_get(path):
    try:
        r = requests.get(f"{FRONTEND}/{path}", timeout=10)
        return r.status_code
    except:
        return 0

log("")
log("=" * 50)
log("  STAMPLY - DIAGNOSTIC COMPLET v4")
log(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
log("=" * 50)
log("")

# 0. HEALTH CHECK
sep()
log("--- 0. HEALTH CHECK ---")
sep()

code, body = get("/api/health", auth=False)
if code == 200:
    pass_(f"Backend health HTTP {code}")
    services = body.get("services", {})
    gw = services.get("google_wallet", {})
    fcm = services.get("fcm", {})
    info(f"Google Wallet: {gw.get('status','?')} | FCM: {fcm.get('status','?')}")
else:
    fail_(f"Backend health HTTP {code}")

fe_code = fe_get("")
if fe_code == 200:
    pass_(f"Frontend HTTP {fe_code}")
else:
    fail_(f"Frontend HTTP {fe_code}")

# 1. AUTH
log("")
sep()
log("--- 1. AUTH ---")
sep()

TS = int(time.time())
AEMAIL = f"diag{TS}@test.com"
ANAME = "Diag Test"
ASHOP = "Diag Shop"
APASS = "Test123456"

code, body = post("/api/auth/register", {
    "email": AEMAIL,
    "password": APASS,
    "nom": ANAME,
    "nom_enseigne": ASHOP,
    "telephone": "0612345678",
    "adresse": "123 rue Test",
    "codePostal": "75001",
    "ville": "Paris"
}, auth=False)

if code in (200, 201):
    data = body.get("data", body)
    TOKEN = data.get("token", "")
    COMMERCANT_ID = data.get("commercant", {}).get("id", "")
    pass_(f"Inscription HTTP {code}")
    info(f"Token: {TOKEN[:40]}...")
    info(f"Commercant ID: {COMMERCANT_ID}")
else:
    fail_(f"Inscription HTTP {code}")
    info(f"Body: {str(body)[:300]}")

code, body = post("/api/auth/login", {"email": AEMAIL, "password": APASS}, auth=False)
if code == 200:
    data = body.get("data", body)
    TOKEN = data.get("token", TOKEN)
    pass_(f"Connexion HTTP {code}")
else:
    fail_(f"Connexion HTTP {code}")
    info(f"Body: {str(body)[:300]}")

if TOKEN:
    code, body = get("/api/auth/me")
    if code == 200:
        pass_(f"Profil HTTP {code}")
    else:
        fail_(f"Profil HTTP {code}")
else:
    fail_("Profil - pas de token")

# 2. SETUP CARTE
log("")
sep()
log("--- 2. SETUP CARTE ---")
sep()

if TOKEN:
    code, body = post("/api/wallet/setup", {
        "nom": "Carte Diag",
        "pointsRecompense": 10,
        "recompense": "Un croissant gratuit",
        "description": "Achetez 10 articles",
        "backgroundColor": "#6366f1",
        "textColor": "#ffffff",
        "overlayColor": "#000000",
        "overlayOpacity": 0.2,
        "fontFamily": "Inter"
    })
    if code in (200, 201):
        pass_(f"Setup carte HTTP {code}")
    else:
        fail_(f"Setup carte HTTP {code}")
        info(f"Body: {str(body)[:300]}")
else:
    fail_("Setup carte - pas de token")

# 3. GOOGLE WALLET
log("")
sep()
log("--- 3. GOOGLE WALLET ---")
sep()

if TOKEN and COMMERCANT_ID:
    # Test GW config
    code, body = get("/api/wallet/test-google")
    info(f"GW test HTTP {code}: {str(body)[:200]}")

    # Generate card for client
    code, body = post(f"/api/wallet/generate-for/{COMMERCANT_ID}", {"clientId": "client-diag-001"})
    if code in (200, 201):
        pass_(f"GW generate carte client HTTP {code}")
        serial = body.get("serialNumber", body.get("serial", ""))
        info(f"Serial: {serial}")
    else:
        fail_(f"GW generate carte client HTTP {code}")
        info(f"Body: {str(body)[:300]}")

    # Install page
    fe_install = fe_get(f"install/{COMMERCANT_ID}")
    if fe_install == 200:
        pass_(f"Page install frontend HTTP {fe_install}")
    else:
        fail_(f"Page install frontend HTTP {fe_install}")
else:
    fail_("Google Wallet - pas de token/CID")

# 4. SCAN QR
log("")
sep()
log("--- 4. SCAN QR ---")
sep()

CARD_ID = None
if TOKEN and COMMERCANT_ID:
    # Create client card
    code, body = post(f"/api/wallet/generate-for/{COMMERCANT_ID}", {"clientId": "client-diag-002", "points": 0})
    if code in (200, 201):
        CARD_ID = body.get("id", body.get("carteId", ""))
        pass_(f"Creation carte client HTTP {code}")
        info(f"Carte ID: {CARD_ID}")
    else:
        fail_(f"Creation carte client HTTP {code}")
        info(f"Body: {str(body)[:300]}")

    if CARD_ID:
        # Scan
        code, body = post("/api/scan", {"carteId": CARD_ID, "commercantId": COMMERCANT_ID})
        if code == 200:
            pts = body.get("points", body.get("tampons", "?"))
            pass_(f"Scan tampon HTTP {code} points={pts}")
        else:
            fail_(f"Scan tampon HTTP {code}")
            info(f"Body: {str(body)[:300]}")

        # Multiple scans
        for i in range(10):
            post("/api/scan", {"carteId": CARD_ID, "commercantId": COMMERCANT_ID})
        pass_("Scans multiples 10 tampons")

        # History
        code, body = get("/api/scan/history")
        if code == 200:
            count = len(body) if isinstance(body, list) else body.get("count", "?")
            if isinstance(count, int) and count > 0:
                pass_(f"Historique scans HTTP {code} count={count}")
            else:
                warn_(f"Historique vide count={count}")
        else:
            fail_(f"Historique scans HTTP {code}")
else:
    fail_("Scan QR - pas de token/CID")

# 5. NOTIFICATIONS PUSH
log("")
sep()
log("--- 5. NOTIFICATIONS PUSH ---")
sep()

if TOKEN:
    code, body = post("/api/notifications/send", {
        "message": "Test diagnostic notification push",
        "title": "Stamply Test"
    })
    if code == 200:
        pass_(f"Envoi notif HTTP {code}")
    else:
        fail_(f"Envoi notif HTTP {code}")
    info(f"Body: {str(body)[:200]}")

    code, body = put("/api/commercants/me", {
        "module_notifications": True,
        "notif_max_par_jour": 10,
        "notif_heure_debut": "08:00",
        "notif_heure_fin": "20:00",
        "notif_template_defaut": "Votre commerce a une offre"
    })
    if code == 200:
        pass_(f"Reglages notifs HTTP {code}")
    else:
        fail_(f"Reglages notifs HTTP {code}")
else:
    fail_("Notifications - pas de token")

# 6. GEOLOCALISATION
log("")
sep()
log("--- 6. GEOLOCALISATION ---")
sep()

if TOKEN:
    code, body = put("/api/commercants/me", {
        "module_geolocalisation": True,
        "geoloc_message": "Bienvenue -10% sur votre prochain achat",
        "geoloc_heure_debut": "08:00",
        "geoloc_heure_fin": "20:00",
        "rayon_geoloc_metres": 200,
        "latitude": 48.8566,
        "longitude": 2.3522
    })
    if code == 200:
        pass_(f"Config geoloc HTTP {code}")
    else:
        fail_(f"Config geoloc HTTP {code}")
    info(f"Body: {str(body)[:200]}")

    # Verify saved
    code, body = get("/api/auth/me")
    if code == 200:
        c = body.get("commercant", {})
        geo_active = c.get("module_geolocalisation", False)
        geo_msg = c.get("geoloc_message", "")
        lat = c.get("latitude", "")
        lng = c.get("longitude", "")
        rayon = c.get("rayon_geoloc_metres", "")
        if geo_active:
            pass_("Geoloc active en base")
            info(f"Message: {geo_msg} | Lat: {lat} | Lng: {lng} | Rayon: {rayon}m")
        else:
            warn_(f"Geoloc pas active en base (module_geolocalisation: {geo_active})")
else:
    fail_("Geolocalisation - pas de token")

# 7. OFFRES FLASH
log("")
sep()
log("--- 7. OFFRES FLASH ---")
sep()

if TOKEN:
    code, body = post("/api/offres-flash", {
        "titre": "-20% sur les croissants",
        "description": "Offre limitee",
        "reduction_pourcentage": 20,
        "prix_original": 2.50,
        "prix_reduit": 2.00,
        "code_promo": "CROISSANT20",
        "max_reclamations": 50
    })
    if code in (200, 201):
        pass_(f"Creation offre flash HTTP {code}")
    else:
        fail_(f"Creation offre flash HTTP {code}")
        info(f"Body: {str(body)[:300]}")

    code, body = get("/api/offres-flash")
    if code == 200:
        count = len(body) if isinstance(body, list) else body.get("count", "?")
        if isinstance(count, int) and count > 0:
            pass_(f"Liste offres flash HTTP {code} count={count}")
        else:
            warn_(f"Liste offres vide count={count}")
    else:
        fail_(f"Liste offres flash HTTP {code}")
else:
    fail_("Offres Flash - pas de token")

# 8. BOUTIQUES
log("")
sep()
log("--- 8. BOUTIQUES ---")
sep()

if TOKEN:
    code, body = post("/api/boutiques", {
        "nom": "Boutique Diag",
        "adresse": "456 avenue Test",
        "codePostal": "75002",
        "ville": "Paris",
        "telephone": "0698765432",
        "carte_couleur_primaire": "#6366f1",
        "carte_couleur_secondaire": "#764ba2",
        "points_recompense": 10,
        "actif": True
    })
    if code in (200, 201):
        pass_(f"Creation boutique HTTP {code}")
    else:
        fail_(f"Creation boutique HTTP {code}")
        info(f"Body: {str(body)[:300]}")

    code, body = get("/api/boutiques")
    if code == 200:
        count = len(body) if isinstance(body, list) else body.get("count", "?")
        if isinstance(count, int) and count > 0:
            pass_(f"Liste boutiques HTTP {code} count={count}")
        else:
            warn_(f"Liste boutiques vide count={count}")
    else:
        fail_(f"Liste boutiques HTTP {code}")
else:
    fail_("Boutiques - pas de token")

# 9. MENU DU JOUR
log("")
sep()
log("--- 9. MENU DU JOUR ---")
sep()

if TOKEN:
    code, body = put("/api/commercants/me", {
        "module_menu_jour": True,
        "menu_categories": "Entrees,Plats,Desserts",
        "menu_devise": "EUR",
        "menu_afficher_prix": True
    })
    if code == 200:
        pass_(f"Config menu jour HTTP {code}")
    else:
        fail_(f"Config menu jour HTTP {code}")

    code, body = post("/api/menus", {
        "titre": "Menu du jour",
        "description": "Plat + dessert",
        "prix": 12.50,
        "categorie": "Plats"
    })
    if code in (200, 201):
        pass_(f"Creation menu HTTP {code}")
    else:
        warn_(f"Creation menu HTTP {code} - route peut-etre pas implementee")
    info(f"Body: {str(body)[:200]}")
else:
    fail_("Menu du jour - pas de token")

# 10. AVIS GOOGLE
log("")
sep()
log("--- 10. AVIS GOOGLE ---")
sep()

if TOKEN:
    code, body = put("/api/commercants/me", {
        "module_avis_google": True,
        "google_place_url": "https://maps.google.com/?cid=123456",
        "auto_review_message": "Merci Laissez-nous un avis",
        "auto_review_seuil_etoiles": 4,
        "auto_review_alerte_email": True
    })
    if code == 200:
        pass_(f"Config avis Google HTTP {code}")
    else:
        fail_(f"Config avis Google HTTP {code}")

    code, body = get("/api/auth/me")
    if code == 200:
        c = body.get("commercant", {})
        avis_active = c.get("module_avis_google", False)
        if avis_active:
            pass_("Avis Google actif en base")
        else:
            warn_(f"Avis Google pas actif en base")
else:
    fail_("Avis Google - pas de token")

# 11. IMAGES / UPLOAD
log("")
sep()
log("--- 11. IMAGES / UPLOAD ---")
sep()

if TOKEN:
    import base64
    tiny_png = base64.b64encode(bytes([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,0xde,0x00,0x00,0x00,0x0c,0x49,0x44,0x41,0x54,0x08,0xd7,0x63,0xf8,0xcf,0xc0,0x00,0x00,0x00,0x02,0x00,0x01,0xe2,0x21,0xbc,0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4e,0x44,0xae,0x42,0x60,0x82])).decode()
    
    code, body = post("/api/images/upload", {"image": tiny_png, "filename": "test.png"})
    if code in (200, 201):
        pass_(f"Upload image HTTP {code}")
    else:
        fail_(f"Upload image HTTP {code}")
    info(f"Body: {str(body)[:200]}")

    code, body = get("/api/images")
    if code == 200:
        pass_(f"Liste images HTTP {code}")
    else:
        warn_(f"Liste images HTTP {code}")
else:
    fail_("Images - pas de token")

# 12. BADGES
log("")
sep()
log("--- 12. BADGES ---")
sep()

if TOKEN:
    code, body = get("/api/badges/stats")
    if code == 200:
        pass_(f"Badges stats HTTP {code}")
    else:
        fail_(f"Badges stats HTTP {code}")
        info(f"Body: {str(body)[:200]}")

    if CARD_ID:
        code, body = get(f"/api/badges/client/{CARD_ID}")
        if code == 200:
            count = len(body) if isinstance(body, list) else body.get("count", "?")
            pass_(f"Badges client HTTP {code} count={count}")
        else:
            fail_(f"Badges client HTTP {code}")
            info(f"Body: {str(body)[:200]}")
else:
    fail_("Badges - pas de token")

# 13. PROGRAMME FIDELITE
log("")
sep()
log("--- 13. PROGRAMME FIDELITE ---")
sep()

if TOKEN:
    code, body = get("/api/wallet/cartes")
    if code == 200:
        count = len(body) if isinstance(body, list) else body.get("count", "?")
        pass_(f"Liste cartes HTTP {code} count={count}")
    else:
        fail_(f"Liste cartes HTTP {code}")

    code, body = get("/api/rewards/config")
    if code == 200:
        pass_(f"Rewards config HTTP {code}")
    else:
        fail_(f"Rewards config HTTP {code}")
        info(f"Body: {str(body)[:200]}")
else:
    fail_("Cartes - pas de token")

# 14. DASHBOARD and PWA
log("")
sep()
log("--- 14. DASHBOARD and PWA ---")
sep()

DPAGES = ["dashboard", "dashboard/setup-card", "dashboard/parametres", "dashboard/scan",
          "dashboard/notifications", "dashboard/offres-flash", "dashboard/boutiques",
          "dashboard/menu-jour", "dashboard/avis"]
DOK = sum(1 for p in DPAGES if fe_get(p) == 200)
if DOK == len(DPAGES):
    pass_(f"Pages dashboard {DOK}/{len(DPAGES)}")
else:
    warn_(f"Pages dashboard {DOK}/{len(DPAGES)}")

MF = fe_get("manifest.json")
if MF == 200:
    pass_(f"PWA manifest HTTP {MF}")
else:
    fail_(f"PWA manifest HTTP {MF}")

# FINAL SUMMARY
log("")
log("=" * 50)
log("  RESUME DIAGNOSTIC")
log("=" * 50)
log("")
log(f"  PASS: {PASS}")
log(f"  FAIL: {FAIL}")
log(f"  WARN: {WARN}")
log("")
sep()

TOTAL = PASS + FAIL + WARN
if TOTAL > 0:
    PCT = PASS * 100 // TOTAL
    log(f"  Score: {PCT}% ({PASS}/{TOTAL})")

log("")
log("Detail:")
for r in RESULTS:
    log(f"  {r}")

log("")
if FAIL == 0:
    log("TOUS LES MODULES FONCTIONNENT !")
elif FAIL <= 3:
    log("Quelques problemes mineurs a corriger")
else:
    log("Plusieurs modules necessitent des corrections")
log("")
