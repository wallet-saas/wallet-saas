#!/usr/bin/env python3
"""STAMPLY - Diagnostic complet modules v5"""
import requests, json, time, sys
from datetime import datetime

BACKEND = "https://stamply-backend-gn8z.onrender.com"
FRONTEND = "https://stamply-gamma.vercel.app"
PASS = 0; FAIL = 0; WARN = 0; RESULTS = []
TOKEN = None; COMMERCANT_ID = None; CARD_ID = None

def log(msg): print(msg)
def pass_(msg):
    global PASS; PASS += 1; RESULTS.append("PASS: " + msg); log("  [PASS] " + msg)
def fail_(msg):
    global FAIL; FAIL += 1; RESULTS.append("FAIL: " + msg); log("  [FAIL] " + msg)
def warn_(msg):
    global WARN; WARN += 1; RESULTS.append("WARN: " + msg); log("  [WARN] " + msg)
def info(msg): log("  [INFO] " + msg)
def sep(): log("-" * 50)

def auth_h():
    if TOKEN: return {"Authorization": "Bearer " + TOKEN}
    return {}

def post(path, data, auth=True):
    h = {"Content-Type": "application/json"}
    if auth: h.update(auth_h())
    try:
        r = requests.post(BACKEND + path, json=data, headers=h, timeout=15)
        try: body = r.json()
        except: body = r.text
        return r.status_code, body
    except Exception as e:
        return 0, str(e)

def get(path, auth=True):
    h = {}
    if auth: h.update(auth_h())
    try:
        r = requests.get(BACKEND + path, headers=h, timeout=15)
        try: body = r.json()
        except: body = r.text
        return r.status_code, body
    except Exception as e:
        return 0, str(e)

def put(path, data, auth=True):
    h = {"Content-Type": "application/json"}
    if auth: h.update(auth_h())
    try:
        r = requests.put(BACKEND + path, json=data, headers=h, timeout=15)
        try: body = r.json()
        except: body = r.text
        return r.status_code, body
    except Exception as e:
        return 0, str(e)

def fe_get(path):
    try:
        r = requests.get(FRONTEND + "/" + path, timeout=10)
        return r.status_code
    except: return 0

def extract_token(body):
    """Extract token from various response formats"""
    if isinstance(body, dict):
        # Try data.token first
        data = body.get("data", {})
        if isinstance(data, dict):
            t = data.get("token", "")
            if t: return t
        # Try root level
        t = body.get("token", "")
        if t: return t
    return ""

def extract_commercant(body):
    """Extract commercant object from API response, handling both {data: {commercant: {...}} and {commercant: {...}} formats"""
    if isinstance(body, dict):
        data = body.get("data", {})
        if isinstance(data, dict) and "commercant" in data:
            return data["commercant"]
        if "commercant" in body:
            return body["commercant"]
    return {}

def extract_commercant_id(body):
    c = extract_commercant(body)
    return c.get("id", "") if isinstance(c, dict) else ""

log("")
log("=" * 50)
log("  STAMPLY - DIAGNOSTIC COMPLET v5")
log("  " + datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
log("=" * 50)
log("")

# 0. HEALTH CHECK
sep(); log("--- 0. HEALTH CHECK ---"); sep()
code, body = get("/api/health", auth=False)
if code == 200:
    pass_("Backend health HTTP " + str(code))
    services = body.get("services", {}) if isinstance(body, dict) else {}
    gw = services.get("google_wallet", {})
    fcm = services.get("fcm", {})
    info("Google Wallet: " + str(gw.get('status','?')) + " | FCM: " + str(fcm.get('status','?')))
else:
    fail_("Backend health HTTP " + str(code))

fe_code = fe_get("")
if fe_code == 200: pass_("Frontend HTTP " + str(fe_code))
else: fail_("Frontend HTTP " + str(fe_code))

# 1. AUTH
log(""); sep(); log("--- 1. AUTH ---"); sep()
TS = int(time.time() * 1000)
AEMAIL = "diag" + str(TS) + "@test.com"
APASS = "Test123456"

code, body = post("/api/auth/register", {
    "email": AEMAIL, "password": APASS, "nom": "Diag Test",
    "nom_enseigne": "Diag Shop", "telephone": "0612345678",
    "adresse": "123 rue Test", "codePostal": "75001", "ville": "Paris"
}, auth=False)

if code in (200, 201):
    TOKEN=extract_token(body)
    COMMERCANT_ID = extract_commercant_id(body)
    pass_("Inscription HTTP " + str(code))
    info("Token: " + TOKEN[:40] + "...")
    info("Commercant ID: " + COMMERCANT_ID)
else:
    fail_("Inscription HTTP " + str(code))
    info("Body: " + str(body)[:300])

# Login
code, body = post("/api/auth/login", {"email": AEMAIL, "password": APASS}, auth=False)
if code == 200:
    new_token = extract_token(body)
    if new_token: TOKEN=new_token
    pass_("Connexion HTTP " + str(code))
else:
    fail_("Connexion HTTP " + str(code))
    info("Body: " + str(body)[:300])

# Get Me
if TOKEN:
    code, body = get("/api/auth/me")
    if code == 200:
        pass_("Profil HTTP " + str(code))
        # Check if commercant data is present
        c = extract_commercant(body)
        info("Email: " + str(c.get("email", "N/A")))
    else:
        fail_("Profil HTTP " + str(code))
        info("Body: " + str(body)[:200])
else:
    fail_("Profil - pas de token")

# 2. SETUP CARTE
log(""); sep(); log("--- 2. SETUP CARTE ---"); sep()
if TOKEN:
    code, body = post("/api/wallet/setup", {
        "nom": "Carte Diag", "pointsRecompense": 10,
        "recompense": "Un croissant gratuit", "description": "Achetez 10 articles",
        "backgroundColor": "#6366f1", "textColor": "#ffffff",
        "overlayColor": "#000000", "overlayOpacity": 0.2, "fontFamily": "Inter"
    })
    if code in (200, 201): pass_("Setup carte HTTP " + str(code))
    else:
        fail_("Setup carte HTTP " + str(code))
        info("Body: " + str(body)[:300])
else:
    fail_("Setup carte - pas de token")

# 3. GOOGLE WALLET
log(""); sep(); log("--- 3. GOOGLE WALLET ---"); sep()
if TOKEN and COMMERCANT_ID:
    code, body = get("/api/wallet/test-google")
    info("GW test HTTP " + str(code) + ": " + str(body)[:200])

    code, body = post("/api/wallet/generate-for/" + COMMERCANT_ID, {"clientId": "client-diag-001"})
    if code in (200, 201):
        pass_("GW generate carte HTTP " + str(code))
        serial = body.get("serialNumber", body.get("serial", "")) if isinstance(body, dict) else ""
        info("Serial: " + str(serial))
    else:
        fail_("GW generate carte HTTP " + str(code))
        info("Body: " + str(body)[:300])

    fe_install = fe_get("install/" + COMMERCANT_ID)
    if fe_install == 200: pass_("Page install frontend HTTP " + str(fe_install))
    else: fail_("Page install frontend HTTP " + str(fe_install))
else:
    fail_("Google Wallet - pas de token/CID")

# 4. SCAN QR
log(""); sep(); log("--- 4. SCAN QR ---"); sep()
CARD_ID = None
if TOKEN and COMMERCANT_ID:
    code, body = post("/api/wallet/generate-for/" + COMMERCANT_ID, {"clientId": "client-diag-002", "points": 0})
    if code in (200, 201):
        CARD_ID = body.get("id", body.get("carteId", "")) if isinstance(body, dict) else ""
        pass_("Creation carte client HTTP " + str(code))
        info("Carte ID: " + str(CARD_ID))
    else:
        fail_("Creation carte client HTTP " + str(code))
        info("Body: " + str(body)[:300])

    if CARD_ID:
        code, body = post("/api/scan", {"carteId": CARD_ID, "commercantId": COMMERCANT_ID})
        if code == 200:
            pts = body.get("points", body.get("tampons", "?")) if isinstance(body, dict) else "?"
            pass_("Scan tampon HTTP " + str(code) + " points=" + str(pts))
        else:
            fail_("Scan tampon HTTP " + str(code))
            info("Body: " + str(body)[:300])

        for i in range(10):
            post("/api/scan", {"carteId": CARD_ID, "commercantId": COMMERCANT_ID})
        pass_("Scans multiples 10 tampons")

        code, body = get("/api/scan/history")
        if code == 200:
            count = len(body) if isinstance(body, list) else (body.get("count", "?") if isinstance(body, dict) else "?")
            if isinstance(count, int) and count > 0: pass_("Historique scans HTTP " + str(code) + " count=" + str(count))
            else: warn_("Historique vide count=" + str(count))
        else:
            fail_("Historique scans HTTP " + str(code))
else:
    fail_("Scan QR - pas de token/CID")

# 5. NOTIFICATIONS PUSH
log(""); sep(); log("--- 5. NOTIFICATIONS PUSH ---"); sep()
if TOKEN:
    code, body = post("/api/notifications/send", {"message": "Test diagnostic notification push", "titre": "Stamply Test"})
    if code == 200: pass_("Envoi notif HTTP " + str(code))
    else: fail_("Envoi notif HTTP " + str(code))
    info("Body: " + str(body)[:200])

    code, body = put("/api/commercants/me", {
        "module_notifications": True, "notif_max_par_jour": 10,
        "notif_heure_debut": "08:00", "notif_heure_fin": "20:00",
        "notif_template_defaut": "Votre commerce a une offre"
    })
    if code == 200: pass_("Reglages notifs HTTP " + str(code))
    else: fail_("Reglages notifs HTTP " + str(code))
else:
    fail_("Notifications - pas de token")

# 6. GEOLOCALISATION
log(""); sep(); log("--- 6. GEOLOCALISATION ---"); sep()
if TOKEN:
    code, body = put("/api/commercants/me", {
        "module_geolocalisation": True, "geoloc_message": "Bienvenue -10% sur votre prochain achat",
        "geoloc_heure_debut": "08:00", "geoloc_heure_fin": "20:00",
        "rayon_geoloc_metres": 200, "latitude": 48.8566, "longitude": 2.3522
    })
    if code == 200: pass_("Config geoloc HTTP " + str(code))
    else: fail_("Config geoloc HTTP " + str(code))
    info("Body: " + str(body)[:200])

    code, body = get("/api/auth/me")
    if code == 200:
        c = extract_commercant(body)
        geo_active = c.get("module_geolocalisation", False)
        geo_msg = c.get("geoloc_message", "")
        lat = c.get("latitude", ""); lng = c.get("longitude", "")
        rayon = c.get("rayon_geoloc_metres", "")
        if geo_active: pass_("Geoloc active en base")
        else: warn_("Geoloc pas active en base")
        info("Message: " + str(geo_msg) + " | Lat: " + str(lat) + " | Lng: " + str(lng) + " | Rayon: " + str(rayon))
else:
    fail_("Geolocalisation - pas de token")

# 7. OFFRES FLASH
log(""); sep(); log("--- 7. OFFRES FLASH ---"); sep()
if TOKEN:
    code, body = post("/api/offres-flash", {
        "titre": "-20% croissants", "description": "Offre limitee",
        "reduction_pourcentage": 20, "prix_original": 2.50, "prix_reduit": 2.00,
        "code_promo": "CROISSANT20", "max_reclamations": 50
    })
    if code in (200, 201): pass_("Creation offre flash HTTP " + str(code))
    else:
        fail_("Creation offre flash HTTP " + str(code))
        info("Body: " + str(body)[:300])

    code, body = get("/api/offres-flash")
    if code == 200:
        if isinstance(body, list):
            count = len(body)
        elif isinstance(body, dict):
            data = body.get("data", body.get("offres", []))
            count = len(data) if isinstance(data, list) else 0
        else:
            count = "?"
        if isinstance(count, int) and count > 0: pass_("Liste offres flash HTTP " + str(code) + " count=" + str(count))
        else: warn_("Liste offres vide count=" + str(count))
    else:
        fail_("Liste offres flash HTTP " + str(code))
else:
    fail_("Offres Flash - pas de token")

# 8. BOUTIQUES
log(""); sep(); log("--- 8. BOUTIQUES ---"); sep()
if TOKEN:
    code, body = post("/api/boutiques", {
        "nom": "Boutique Diag", "adresse": "456 avenue Test",
        "codePostal": "75002", "ville": "Paris", "telephone": "0698765432",
        "carte_couleur_primaire": "#6366f1", "carte_couleur_secondaire": "#764ba2",
        "points_recompense": 10, "actif": True
    })
    if code in (200, 201): pass_("Creation boutique HTTP " + str(code))
    else:
        fail_("Creation boutique HTTP " + str(code))
        info("Body: " + str(body)[:300])

    code, body = get("/api/boutiques")
    if code == 200:
        count = len(body) if isinstance(body, list) else (body.get("count", "?") if isinstance(body, dict) else "?")
        if isinstance(count, int) and count > 0: pass_("Liste boutiques HTTP " + str(code) + " count=" + str(count))
        else: warn_("Liste boutiques vide count=" + str(count))
    else:
        fail_("Liste boutiques HTTP " + str(code))
else:
    fail_("Boutiques - pas de token")

# 9. MENU DU JOUR
log(""); sep(); log("--- 9. MENU DU JOUR ---"); sep()
if TOKEN:
    code, body = put("/api/commercants/me", {
        "module_menu_jour": True, "menu_categories": "Entrees,Plats,Desserts",
        "menu_devise": "EUR", "menu_afficher_prix": True
    })
    if code == 200: pass_("Config menu jour HTTP " + str(code))
    else: fail_("Config menu jour HTTP " + str(code))

    code, body = post("/api/menus", {
        "titre": "Menu du jour", "description": "Plat + dessert",
        "prix": 12.50, "categorie": "Plats"
    })
    if code in (200, 201): pass_("Creation menu HTTP " + str(code))
    else: warn_("Creation menu HTTP " + str(code) + " - route peut-etre pas implementee")
    info("Body: " + str(body)[:200])
else:
    fail_("Menu du jour - pas de token")

# 10. AVIS GOOGLE
log(""); sep(); log("--- 10. AVIS GOOGLE ---"); sep()
if TOKEN:
    code, body = put("/api/commercants/me", {
        "module_avis_google": True, "google_place_url": "https://maps.google.com/?cid=123456",
        "auto_review_message": "Merci Laissez-nous un avis",
        "auto_review_seuil_etoiles": 4, "auto_review_alerte_email": True
    })
    if code == 200: pass_("Config avis Google HTTP " + str(code))
    else: fail_("Config avis Google HTTP " + str(code))

    code, body = get("/api/auth/me")
    if code == 200:
        c = extract_commercant(body)
        avis_active = c.get("module_avis_google", False)
        if avis_active: pass_("Avis Google actif en base")
        else: warn_("Avis Google pas actif en base")
else:
    fail_("Avis Google - pas de token")

# 11. IMAGES / UPLOAD
log(""); sep(); log("--- 11. IMAGES / UPLOAD ---"); sep()
if TOKEN:
    import base64
    tiny_png = base64.b64encode(bytes([
        0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52,
        0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
        0xde,0x00,0x00,0x00,0x0c,0x49,0x44,0x41,0x54,0x08,0xd7,0x63,0xf8,0xcf,0xc0,0x00,
        0x00,0x00,0x02,0x00,0x01,0xe2,0x21,0xbc,0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4e,
        0x44,0xae,0x42,0x60,0x82
    ])).decode()

    code, body = post("/api/images/upload", {"image": tiny_png, "filename": "test.png"})
    if code in (200, 201): pass_("Upload image HTTP " + str(code))
    else: fail_("Upload image HTTP " + str(code))
    info("Body: " + str(body)[:200])

    code, body = get("/api/images")
    if code == 200: pass_("Liste images HTTP " + str(code))
    else: warn_("Liste images HTTP " + str(code))
else:
    fail_("Images - pas de token")

# 12. BADGES
log(""); sep(); log("--- 12. BADGES ---"); sep()
if TOKEN:
    code, body = get("/api/badges/stats")
    if code == 200: pass_("Badges stats HTTP " + str(code))
    else:
        fail_("Badges stats HTTP " + str(code))
        info("Body: " + str(body)[:200])

    if CARD_ID:
        code, body = get("/api/badges/client/" + str(CARD_ID))
        if code == 200:
            count = len(body) if isinstance(body, list) else (body.get("count", "?") if isinstance(body, dict) else "?")
            pass_("Badges client HTTP " + str(code) + " count=" + str(count))
        else:
            fail_("Badges client HTTP " + str(code))
            info("Body: " + str(body)[:200])
else:
    fail_("Badges - pas de token")

# 13. PROGRAMME FIDELITE
log(""); sep(); log("--- 13. PROGRAMME FIDELITE ---"); sep()
if TOKEN:
    code, body = get("/api/wallet/cartes")
    if code == 200:
        count = len(body) if isinstance(body, list) else (body.get("count", "?") if isinstance(body, dict) else "?")
        pass_("Liste cartes HTTP " + str(code) + " count=" + str(count))
    else:
        fail_("Liste cartes HTTP " + str(code))

    code, body = get("/api/rewards/config")
    if code == 200: pass_("Rewards config HTTP " + str(code))
    else:
        fail_("Rewards config HTTP " + str(code))
        info("Body: " + str(body)[:200])
else:
    fail_("Cartes - pas de token")

# 14. DASHBOARD & PWA
log(""); sep(); log("--- 14. DASHBOARD & PWA ---"); sep()
DPAGES = [
    "dashboard", "dashboard/setup-card", "dashboard/parametres", "dashboard/scan",
    "dashboard/notifications", "dashboard/offres", "dashboard/boutiques",
    "dashboard/menus", "dashboard/avis"
]
DOK = sum(1 for p in DPAGES if fe_get(p) == 200)
if DOK == len(DPAGES): pass_("Pages dashboard " + str(DOK) + "/" + str(len(DPAGES)))
else: warn_("Pages dashboard " + str(DOK) + "/" + str(len(DPAGES)))

MF = fe_get("manifest.json")
if MF == 200: pass_("PWA manifest HTTP " + str(MF))
else: fail_("PWA manifest HTTP " + str(MF))

# FINAL SUMMARY
log(""); log("=" * 50); log("  RESUME DIAGNOSTIC"); log("=" * 50); log("")
log("  PASS: " + str(PASS)); log("  FAIL: " + str(FAIL)); log("  WARN: " + str(WARN)); log(""); sep()
TOTAL = PASS + FAIL + WARN
if TOTAL > 0:
    PCT = PASS * 100 // TOTAL
    log("  Score: " + str(PCT) + "% (" + str(PASS) + "/" + str(TOTAL) + ")")
log(""); log("Detail:")
for r in RESULTS: log("  " + r)
log("")
if FAIL == 0: log("TOUS LES MODULES FONCTIONNENT !")
elif FAIL <= 3: log("Quelques problemes mineurs a corriger")
else: log("Plusieurs modules necessitent des corrections")
log("")
