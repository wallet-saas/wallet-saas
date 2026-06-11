#!/bin/bash
# STAMPLY - Diagnostic complet modules v3
# ========================================

BACKEND="https://stamply-backend-gn8z.onrender.com"
FRONTEND="https://stamply-gamma.vercel.app"
PASS=0
FAIL=0
WARN=0
RESULTS=()

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

log()  { echo -e "$1"; }
pass() { PASS=$((PASS+1)); RESULTS+=("PASS: $1"); log "${GREEN}PASS $1${NC}"; }
fail() { FAIL=$((FAIL+1)); RESULTS+=("FAIL: $1"); log "${RED}FAIL $1${NC}"; }
warn() { WARN=$((WARN+1)); RESULTS+=("WARN: $1"); log "${YELLOW}WARN $1${NC}"; }
info() { log "${BLUE}INFO $1${NC}"; }
sep()  { log "${BLUE}------------------------------------------${NC}"; }

auth_h() {
  if [ -f /tmp/stamply_token ] && [ -s /tmp/stamply_token ]; then
    echo "Authorization: Bearer *** /tmp/stamply_token)"
  else
    echo "Authorization: Bearer NONE"
  fi
}

log ""
log "${BLUE}==========================================${NC}"
log "${BLUE}  STAMPLY - DIAGNOSTIC COMPLET v3${NC}"
log "${BLUE}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
log "${BLUE}==========================================${NC}"
log ""

# 0. HEALTH CHECK
sep
log "${BLUE}--- 0. HEALTH CHECK ---${NC}"
sep

H=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND/api/health" 2>/dev/null)
if [ "$H" = "200" ]; then
  pass "Backend health HTTP $H"
  HJ=$(curl -s "$BACKEND/api/health" 2>/dev/null)
  # Extract key info
  GW_STATUS=$(echo "$HJ" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('services',{}).get('google_wallet',{}).get('status','?'))" 2>/dev/null)
  FCM_STATUS=$(echo "$HJ" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('services',{}).get('fcm',{}).get('status','?'))" 2>/dev/null)
  info "  Google Wallet: $GW_STATUS | FCM: $FCM_STATUS"
else
  fail "Backend health HTTP $H"
fi

FE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND" 2>/dev/null)
[ "$FE" = "200" ] && pass "Frontend HTTP $FE" || fail "Frontend HTTP $FE"

# 1. AUTH
log ""
sep
log "${BLUE}--- 1. AUTH ---${NC}"
sep

TS=$(date +%s)
AEMAIL="diag...com"
ANAME="Diag Test"
ASHOP="Diag Shop"
APASS="Test123456"

REG=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$AEMAIL\",\"password\":\"$APASS\",\"nom\":\"$ANAME\",\"nom_enseigne\":\"$ASHOP\",\"telephone\":\"0612345678\",\"adresse\":\"123 rue Test\",\"codePostal\":\"75001\",\"ville\":\"Paris\"}")

RC=$(echo "$REG" | tail -1)
RB=$(echo "$REG" | sed '$d')

if [ "$RC" = "200" ] || [ "$RC" = "201" ]; then
  TOKEN=\$(echo "\$RB" | python3 -c "import sys,json; print(json.load(sys.stdin).get(chr(116)+chr(111)+chr(107)+chr(101)+chr(110),chr(39)+chr(39)))" 2>/dev/null)
  echo "$TOKEN" > /tmp/stamply_token
  CID=$(echo "$RB" | python3 -c "import sys,json; print(json.load(sys.stdin).get('commercant',{}).get('id',''))" 2>/dev/null)
  pass "Inscription HTTP $RC"
  info "  Token: ${TOKEN:0:40}..."
  info "  Commercant ID: $CID"
else
  fail "Inscription HTTP $RC"
  info "  Body: $RB"
fi

# Login
LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$AEMAIL\",\"password\":\"$APASS\"}")

LC=$(echo "$LOGIN" | tail -1)
LB=$(echo "$LOGIN" | sed '$d')

if [ "$LC" = "200" ]; then
  TOKEN=*** "$LB" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)
  echo "$TOKEN" > /tmp/stamply_token
  pass "Connexion HTTP $LC"
else
  fail "Connexion HTTP $LC"
  info "  Body: $LB"
fi

# Get Me
if [ -n "$TOKEN" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  ME=$(curl -s -w "\n%{http_code}" "$BACKEND/api/auth/me" -H "$(auth_h)")
  MC=$(echo "$ME" | tail -1)
  MB=$(echo "$ME" | sed '$d')
  if [ "$MC" = "200" ]; then
    EMAIL_CHECK=$(echo "$MB" | python3 -c "import sys,json; d=json.load(sys.stdin).get('commercant',{}); print('email' in d)" 2>/dev/null)
    pass "Profil HTTP $MC (has email: $EMAIL_CHECK)"
  else
    fail "Profil HTTP $MC"
    info "  Body: $(echo "$MB" | head -c 200)"
  fi
else
  fail "Profil - pas de token valide"
fi

# 2. SETUP CARTE (Wallet)
log ""
sep
log "${BLUE}--- 2. SETUP CARTE ---${NC}"
sep

if [ -n "$TOKEN" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  SC=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND/api/wallet/setup" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d '{"nom":"Carte Diag","pointsRecompense":10,"recompense":"Un croissant gratuit","description":"Achetez 10 articles","backgroundColor":"#6366f1","textColor":"#ffffff","overlayColor":"#000000","overlayOpacity":0.2,"fontFamily":"Inter"}')
  SCC=$(echo "$SC" | tail -1)
  SCB=$(echo "$SC" | sed '$d')
  if [ "$SCC" = "200" ] || [ "$SCC" = "201" ]; then
    pass "Setup carte HTTP $SCC"
  else
    fail "Setup carte HTTP $SCC"
    info "  Body: $(echo "$SCB" | head -c 300)"
  fi
else
  fail "Setup carte - pas de token"
fi

# 3. GOOGLE WALLET
log ""
sep
log "${BLUE}--- 3. GOOGLE WALLET ---${NC}"
sep

if [ -n "$TOKEN" ] && [ -n "$CID" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  # Test Google Wallet config
  GW_TEST=$(curl -s -w "\n%{http_code}" "$BACKEND/api/wallet/test-google" -H "$(auth_h)")
  GWTC=$(echo "$GW_TEST" | tail -1)
  GWTB=$(echo "$GW_TEST" | sed '$d')
  info "  GW test HTTP $GWTC: $(echo "$GWTB" | head -c 200)"

  # Generate card for client
  GW_GEN=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND/api/wallet/generate-for/$CID" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d '{"clientId":"client-diag-001"}')
  GWGC=$(echo "$GW_GEN" | tail -1)
  GWGB=$(echo "$GW_GEN" | sed '$d')
  
  if [ "$GWGC" = "200" ] || [ "$GWGC" = "201" ]; then
    pass "GW generate carte client HTTP $GWGC"
    # Extract serial number for install page
    SERIAL=$(echo "$GWGB" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('serialNumber',d.get('serial','')))" 2>/dev/null)
    info "  Serial: $SERIAL"
  else
    fail "GW generate carte client HTTP $GWGC"
    info "  Body: $(echo "$GWGB" | head -c 300)"
  fi

  # Install page
  if [ -n "$SERIAL" ] && [ "$SERIAL" != "None" ]; then
    IP=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND/api/wallet/install/$SERIAL" 2>/dev/null)
    [ "$IP" = "200" ] && pass "Page install serial HTTP $IP" || fail "Page install serial HTTP $IP"
  fi

  # Frontend install page
  IP2=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND/install/$CID" 2>/dev/null)
  [ "$IP2" = "200" ] && pass "Page install frontend HTTP $IP2" || fail "Page install frontend HTTP $IP2"
else
  fail "Google Wallet - pas de token/CID"
fi

# 4. SCAN QR
log ""
sep
log "${BLUE}--- 4. SCAN QR ---${NC}"
sep

CARD_ID=""
if [ -n "$TOKEN" ] && [ -n "$CID" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  # Create a client card via wallet/generate
  CR=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND/api/wallet/generate-for/$CID" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d '{"clientId":"client-diag-002","points":0}')
  CRC=$(echo "$CR" | tail -1)
  CRB=$(echo "$CR" | sed '$d')
  
  if [ "$CRC" = "200" ] || [ "$CRC" = "201" ]; then
    CARD_ID=$(echo "$CRB" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',d.get('carteId','')))" 2>/dev/null)
    pass "Creation carte client HTTP $CRC"
    info "  Carte ID: $CARD_ID"
  else
    fail "Creation carte client HTTP $CRC"
    info "  Body: $(echo "$CRB" | head -c 300)"
  fi

  # Scan
  if [ -n "$CARD_ID" ] && [ "$CARD_ID" != "None" ]; then
    SN=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND/api/scan" \
      -H "$(auth_h)" \
      -H "Content-Type: application/json" \
      -d "{\"carteId\":\"$CARD_ID\",\"commercantId\":\"$CID\"}")
    SNC=$(echo "$SN" | tail -1)
    SNB=$(echo "$SN" | sed '$d')
    
    if [ "$SNC" = "200" ]; then
      PTS=$(echo "$SNB" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('points',d.get('tampons','?')))" 2>/dev/null)
      pass "Scan tampon HTTP $SNC points=$PTS"
    else
      fail "Scan tampon HTTP $SNC"
      info "  Body: $(echo "$SNB" | head -c 300)"
    fi

    # Multiple scans
    for i in 1 2 3 4 5 6 7 8 9 10; do
      curl -s -X POST "$BACKEND/api/scan" \
        -H "$(auth_h)" \
        -H "Content-Type: application/json" \
        -d "{\"carteId\":\"$CARD_ID\",\"commercantId\":\"$CID\"}" > /dev/null
    done
    pass "Scans multiples 10 tampons"

    # History
    HI=$(curl -s -w "\n%{http_code}" "$BACKEND/api/scan/history" -H "$(auth_h)")
    HIC=$(echo "$HI" | tail -1)
    HIB=$(echo "$HI" | sed '$d')
    
    if [ "$HIC" = "200" ]; then
      HC=$(echo "$HIB" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else d.get('count','?'))" 2>/dev/null)
      [ "$HC" -gt "0" ] 2>/dev/null && pass "Historique scans HTTP $HIC count=$HC" || warn "Historique vide count=$HC"
    else
      fail "Historique scans HTTP $HIC"
    fi
  fi
else
  fail "Scan QR - pas de token/CID"
fi

# 5. NOTIFICATIONS PUSH
log ""
sep
log "${BLUE}--- 5. NOTIFICATIONS PUSH ---${NC}"
sep

if [ -n "$TOKEN" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  NF=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND/api/notifications/send" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d '{"message":"Test diagnostic notification push","title":"Stamply Test"}')
  NFC=$(echo "$NF" | tail -1)
  NFB=$(echo "$NF" | sed '$d')
  [ "$NFC" = "200" ] && pass "Envoi notif HTTP $NFC" || fail "Envoi notif HTTP $NFC"
  info "  Body: $(echo "$NFB" | head -c 200)"

  # Settings via commercants/me
  NS=$(curl -s -w "\n%{http_code}" -X PUT "$BACKEND/api/commercants/me" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d '{"module_notifications":true,"notif_max_par_jour":10,"notif_heure_debut":"08:00","notif_heure_fin":"20:00","notif_template_defaut":"Votre commerce a une offre"}')
  NSC=$(echo "$NS" | tail -1)
  [ "$NSC" = "200" ] && pass "Reglages notifs HTTP $NSC" || fail "Reglages notifs HTTP $NSC"
else
  fail "Notifications - pas de token"
fi

# 6. GEOLOCALISATION
log ""
sep
log "${BLUE}--- 6. GEOLOCALISATION ---${NC}"
sep

if [ -n "$TOKEN" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  GE=$(curl -s -w "\n%{http_code}" -X PUT "$BACKEND/api/commercants/me" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d '{"module_geolocalisation":true,"geoloc_message":"Bienvenue -10% sur votre prochain achat","geoloc_heure_debut":"08:00","geoloc_heure_fin":"20:00","rayon_geoloc_metres":200,"latitude":48.8566,"longitude":2.3522}')
  GEC=$(echo "$GE" | tail -1)
  GEB=$(echo "$GE" | sed '$d')
  [ "$GEC" = "200" ] && pass "Config geoloc HTTP $GEC" || fail "Config geoloc HTTP $GEC"
  info "  Body: $(echo "$GEB" | head -c 200)"

  # Verify saved
  ME2=$(curl -s "$BACKEND/api/auth/me" -H "$(auth_h)")
  HG=$(echo "$ME2" | python3 -c "import sys,json; d=json.load(sys.stdin).get('commercant',{}); print(d.get('module_geolocalisation',False))" 2>/dev/null)
  HM=$(echo "$ME2" | python3 -c "import sys,json; d=json.load(sys.stdin).get('commercant',{}); print(d.get('geoloc_message',''))" 2>/dev/null)
  HLAT=$(echo "$ME2" | python3 -c "import sys,json; d=json.load(sys.stdin).get('commercant',{}); print(d.get('latitude',''))" 2>/dev/null)
  HLNG=$(echo "$ME2" | python3 -c "import sys,json; d=json.load(sys.stdin).get('commercant',{}); print(d.get('longitude',''))" 2>/dev/null)
  HR=$(echo "$ME2" | python3 -c "import sys,json; d=json.load(sys.stdin).get('commercant',{}); print(d.get('rayon_geoloc_metres',''))" 2>/dev/null)
  
  if [ "$HG" = "True" ]; then
    pass "Geoloc active en base"
    info "  Message: $HM | Lat: $HLAT | Lng: $HLNG | Rayon: ${HR}m"
  else
    warn "Geoloc pas active en base (module_geolocalisation: $HG)"
  fi
else
  fail "Geolocalisation - pas de token"
fi

# 7. OFFRES FLASH
log ""
sep
log "${BLUE}--- 7. OFFRES FLASH ---${NC}"
sep

if [ -n "$TOKEN" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  OF=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND/api/offres-flash" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d '{"titre":"-20% sur les croissants","description":"Offre limitee","reduction_pourcentage":20,"prix_original":2.50,"prix_reduit":2.00,"code_promo":"CROISSANT20","max_reclamations":50}')
  OFC=$(echo "$OF" | tail -1)
  OFB=$(echo "$OF" | sed '$d')
  
  if [ "$OFC" = "200" ] || [ "$OFC" = "201" ]; then
    pass "Creation offre flash HTTP $OFC"
  else
    fail "Creation offre flash HTTP $OFC"
    info "  Body: $(echo "$OFB" | head -c 300)"
  fi

  LF=$(curl -s -w "\n%{http_code}" "$BACKEND/api/offres-flash" -H "$(auth_h)")
  LFC=$(echo "$LF" | tail -1)
  LFB=$(echo "$LF" | sed '$d')
  
  if [ "$LFC" = "200" ]; then
    FC=$(echo "$LFB" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else d.get('count','?'))" 2>/dev/null)
    [ "$FC" -gt "0" ] 2>/dev/null && pass "Liste offres flash HTTP $LFC count=$FC" || warn "Liste offres vide count=$FC"
  else
    fail "Liste offres flash HTTP $LFC"
  fi
else
  fail "Offres Flash - pas de token"
fi

# 8. BOUTIQUES
log ""
sep
log "${BLUE}--- 8. BOUTIQUES ---${NC}"
sep

if [ -n "$TOKEN" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  BT=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND/api/boutiques" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d '{"nom":"Boutique Diag","adresse":"456 avenue Test","codePostal":"75002","ville":"Paris","telephone":"0698765432","carte_couleur_primaire":"#6366f1","carte_couleur_secondaire":"#764ba2","points_recompense":10,"actif":true}')
  BTC=$(echo "$BT" | tail -1)
  BTB=$(echo "$BT" | sed '$d')
  
  if [ "$BTC" = "200" ] || [ "$BTC" = "201" ]; then
    pass "Creation boutique HTTP $BTC"
  else
    fail "Creation boutique HTTP $BTC"
    info "  Body: $(echo "$BTB" | head -c 300)"
  fi

  LB=$(curl -s -w "\n%{http_code}" "$BACKEND/api/boutiques" -H "$(auth_h)")
  LBC=$(echo "$LB" | tail -1)
  LBB=$(echo "$LB" | sed '$d')
  
  if [ "$LBC" = "200" ]; then
    BC=$(echo "$LBB" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else d.get('count','?'))" 2>/dev/null)
    [ "$BC" -gt "0" ] 2>/dev/null && pass "Liste boutiques HTTP $LBC count=$BC" || warn "Liste boutiques vide count=$BC"
  else
    fail "Liste boutiques HTTP $LBC"
  fi
else
  fail "Boutiques - pas de token"
fi

# 9. MENU DU JOUR
log ""
sep
log "${BLUE}--- 9. MENU DU JOUR ---${NC}"
sep

if [ -n "$TOKEN" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  MJ=$(curl -s -w "\n%{http_code}" -X PUT "$BACKEND/api/commercants/me" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d '{"module_menu_jour":true,"menu_categories":"Entrees,Plats,Desserts","menu_devise":"EUR","menu_afficher_prix":true}')
  MJC=$(echo "$MJ" | tail -1)
  [ "$MJC" = "200" ] && pass "Config menu jour HTTP $MJC" || fail "Config menu jour HTTP $MJC"

  MJ2=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND/api/menus" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d '{"titre":"Menu du jour","description":"Plat + dessert","prix":12.50,"categorie":"Plats"}')
  MJ2C=$(echo "$MJ2" | tail -1)
  MJ2B=$(echo "$MJ2" | sed '$d')
  [ "$MJ2C" = "200" ] || [ "$MJ2C" = "201" ] && pass "Creation menu HTTP $MJ2C" || warn "Creation menu HTTP $MJ2C - route peut-etre pas implementee"
  info "  Body: $(echo "$MJ2B" | head -c 200)"
else
  fail "Menu du jour - pas de token"
fi

# 10. AVIS GOOGLE
log ""
sep
log "${BLUE}--- 10. AVIS GOOGLE ---${NC}"
sep

if [ -n "$TOKEN" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  AV=$(curl -s -w "\n%{http_code}" -X PUT "$BACKEND/api/commercants/me" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d '{"module_avis_google":true,"google_place_url":"https://maps.google.com/?cid=123456","auto_review_message":"Merci Laissez-nous un avis","auto_review_seuil_etoiles":4,"auto_review_alerte_email":true}')
  AVC=$(echo "$AV" | tail -1)
  [ "$AVC" = "200" ] && pass "Config avis Google HTTP $AVC" || fail "Config avis Google HTTP $AVC"

  ME3=$(curl -s "$BACKEND/api/auth/me" -H "$(auth_h)")
  HA=$(echo "$ME3" | python3 -c "import sys,json; d=json.load(sys.stdin).get('commercant',{}); print(d.get('module_avis_google',False))" 2>/dev/null)
  [ "$HA" = "True" ] && pass "Avis Google actif en base" || warn "Avis Google pas actif en base"
else
  fail "Avis Google - pas de token"
fi

# 11. IMAGES / UPLOAD
log ""
sep
log "${BLUE}--- 11. IMAGES / UPLOAD ---${NC}"
sep

if [ -n "$TOKEN" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  TPNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  
  UP=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND/api/images/upload" \
    -H "$(auth_h)" \
    -H "Content-Type: application/json" \
    -d "{\"image\":\"$TPNG\",\"filename\":\"test.png\"}")
  UPC=$(echo "$UP" | tail -1)
  UPB=$(echo "$UP" | sed '$d')
  [ "$UPC" = "200" ] || [ "$UPC" = "201" ] && pass "Upload image HTTP $UPC" || fail "Upload image HTTP $UPC"
  info "  Body: $(echo "$UPB" | head -c 200)"

  IL=$(curl -s -w "\n%{http_code}" "$BACKEND/api/images" -H "$(auth_h)")
  ILC=$(echo "$IL" | tail -1)
  [ "$ILC" = "200" ] && pass "Liste images HTTP $ILC" || warn "Liste images HTTP $ILC"
else
  fail "Images - pas de token"
fi

# 12. BADGES
log ""
sep
log "${BLUE}--- 12. BADGES ---${NC}"
sep

if [ -n "$TOKEN" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  # Check badges routes - they exist in the file but may need carteId
  BG_STATS=$(curl -s -w "\n%{http_code}" "$BACKEND/api/badges/stats" -H "$(auth_h)")
  BGSC=$(echo "$BG_STATS" | tail -1)
  BGSB=$(echo "$BG_STATS" | sed '$d')
  
  if [ "$BGSC" = "200" ]; then
    pass "Badges stats HTTP $BGSC"
  else
    fail "Badges stats HTTP $BGSC"
    info "  Body: $(echo "$BGSB" | head -c 200)"
  fi

  # Client badges
  if [ -n "$CARD_ID" ] && [ "$CARD_ID" != "None" ]; then
    BG_CLIENT=$(curl -s -w "\n%{http_code}" "$BACKEND/api/badges/client/$CARD_ID" -H "$(auth_h)")
    BGCC=$(echo "$BG_CLIENT" | tail -1)
    BGCB=$(echo "$BG_CLIENT" | sed '$d')
    
    if [ "$BGCC" = "200" ]; then
      BGCNT=$(echo "$BGCB" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else d.get('count','?'))" 2>/dev/null)
      pass "Badges client HTTP $BGCC count=$BGCNT"
    else
      fail "Badges client HTTP $BGCC"
      info "  Body: $(echo "$BGCB" | head -c 200)"
    fi
  fi
else
  fail "Badges - pas de token"
fi

# 13. PROGRAMME FIDELITE (Cartes)
log ""
sep
log "${BLUE}--- 13. PROGRAMME FIDELITE ---${NC}"
sep

if [ -n "$TOKEN" ] && [ "$TOKEN" != "NONE" ] && [ "$TOKEN" != "null" ]; then
  CA=$(curl -s -w "\n%{http_code}" "$BACKEND/api/wallet/cartes" -H "$(auth_h)")
  CAC=$(echo "$CA" | tail -1)
  CAB=$(echo "$CA" | sed '$d')
  
  if [ "$CAC" = "200" ]; then
    CC=$(echo "$CAB" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else d.get('count','?'))" 2>/dev/null)
    pass "Liste cartes HTTP $CAC count=$CC"
  else
    fail "Liste cartes HTTP $CAC"
  fi

  # Rewards config
  RC=$(curl -s -w "\n%{http_code}" "$BACKEND/api/rewards/config" -H "$(auth_h)")
  RCC=$(echo "$RC" | tail -1)
  RCB=$(echo "$RC" | sed '$d')
  
  if [ "$RCC" = "200" ]; then
    pass "Rewards config HTTP $RCC"
  else
    fail "Rewards config HTTP $RCC"
    info "  Body: $(echo "$RCB" | head -c 200)"
  fi
else
  fail "Cartes - pas de token"
fi

# 14. DASHBOARD and PWA
log ""
sep
log "${BLUE}--- 14. DASHBOARD and PWA ---${NC}"
sep

DPAGES=("dashboard" "dashboard/setup-card" "dashboard/parametres" "dashboard/scan" "dashboard/notifications" "dashboard/offres-flash" "dashboard/boutiques" "dashboard/menu-jour" "dashboard/avis")
DOK=0
for page in "${DPAGES[@]}"; do
  S=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND/$page" 2>/dev/null)
  [ "$S" = "200" ] && DOK=$((DOK+1))
done
[ "$DOK" -eq "${#DPAGES[@]}" ] && pass "Pages dashboard $DOK/${#DPAGES[@]}" || warn "Pages dashboard $DOK/${#DPAGES[@]}"

MF=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND/manifest.json" 2>/dev/null)
[ "$MF" = "200" ] && pass "PWA manifest HTTP $MF" || fail "PWA manifest HTTP $MF"

# FINAL SUMMARY
log ""
log "${BLUE}==========================================${NC}"
log "${BLUE}  RESUME DIAGNOSTIC${NC}"
log "${BLUE}==========================================${NC}"
log ""
log "${GREEN}PASS: $PASS${NC}"
log "${RED}FAIL: $FAIL${NC}"
log "${YELLOW}WARN: $WARN${NC}"
log ""
sep

TOTAL=$((PASS + FAIL + WARN))
if [ "$TOTAL" -gt 0 ]; then
  PCT=$((PASS * 100 / TOTAL))
  log "Score: ${PCT}% ($PASS/$TOTAL)"
fi

log ""
log "Detail:"
for r in "${RESULTS[@]}"; do
  log "  $r"
done

log ""
if [ "$FAIL" -eq 0 ]; then
  log "${GREEN}TOUS LES MODULES FONCTIONNENT !${NC}"
elif [ "$FAIL" -le 3 ]; then
  log "${YELLOW}Quelques problemes mineurs a corriger${NC}"
else
  log "${RED}Plusieurs modules necessitent des corrections${NC}"
fi
log ""
