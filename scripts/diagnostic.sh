#!/bin/bash
# ============================================================
# Stamply — Script de diagnostic nocturne
# Mode: lecture seule, aucune modification, aucun push
# ============================================================

set -euo pipefail

PROJECT_DIR="/home/ubuntu/stamply/wallet-saas-main"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
REPORT_DIR="$PROJECT_DIR/diagnostics"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
REPORT_FILE="$REPORT_DIR/rapport-$TIMESTAMP.md"

mkdir -p "$REPORT_DIR"

# Couleurs (désactivées si pas de terminal)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

pass=0
fail=0
warn=0

log_pass() { ((pass++)); echo -e "${GREEN}✅ PASS${NC} $1"; }
log_fail() { ((fail++)); echo -e "${RED}❌ FAIL${NC} $1"; }
log_warn() { ((warn++)); echo -e "${YELLOW}⚠️ WARN${NC} $1"; }
log_info() { echo -e "   ℹ️  $1"; }

echo ""
echo "============================================"
echo "  STAMPLY — DIAGNOSTIC NOCTURNE"
echo "  $(date +"%d/%m/%Y %H:%M")"
echo "============================================"
echo ""

# ============================================================
# SECTION 1: BUILD FRONTEND
# ============================================================
echo "🔨 SECTION 1 — Build Frontend"
echo "--------------------------------------------"

cd "$FRONTEND_DIR"
if npm run build > /tmp/build-frontend.log 2>&1; then
    log_pass "Build frontend OK"
else
    log_fail "Build frontend ERREUR"
    log_info "Voir /tmp/build-frontend.log"
fi
echo ""

# ============================================================
# SECTION 2: BUILD BACKEND
# ============================================================
echo "🔨 SECTION 2 — Build Backend"
echo "--------------------------------------------"

cd "$BACKEND_DIR"
# Backend Node.js pas de build step, on vérifie que le syntaxe est OK
if node --check src/index.js > /dev/null 2>&1; then
    log_pass "Syntaxe backend OK"
else
    log_fail "Syntaxe backend ERREUR"
fi

# Vérifie que les routes se chargent sans erreur
if node -e "
const express = require('express');
try {
  require('./src/index.js');
  console.log('OK');
} catch(e) {
  console.error(e.message);
  process.exit(1);
}
" > /tmp/backend-syntax.log 2>&1; then
    log_pass "Backend se charge sans erreur"
else
    log_warn "Impossible de charger le backend en isolation (normal si dépendances manquantes)"
fi
echo ""

# ============================================================
# SECTION 3: TYPE CHECK (TSC)
# ============================================================
echo "🔍 SECTION 3 — TypeScript Check"
echo "--------------------------------------------"

cd "$FRONTEND_DIR"
if [ -f tsconfig.json ]; then
    if npx tsc --noEmit > /tmp/tsc.log 2>&1; then
        log_pass "TypeScript OK — aucune erreur"
    else
        TSC_ERRORS=$(wc -l < /tmp/tsc.log)
        log_fail "TypeScript: $TSC_ERRORS lignes d'erreurs détectées"
        log_info "Voir /tmp/tsc.log"
    fi
else
    log_warn "Pas de tsconfig.json — skip"
fi
echo ""

# ============================================================
# SECTION 4: LINT
# ============================================================
echo "🔍 SECTION 4 — ESLint"
echo "--------------------------------------------"

cd "$FRONTEND_DIR"
if [ -f .eslintrc.json ] || [ -f .eslintrc.js ] || [ -f .eslintrc ]; then
    if npx eslint src/ --ext .ts,.tsx > /tmp/eslint.log 2>&1; then
        log_pass "ESLint OK — aucune erreur"
    else
        LINT_ERRORS=$(grep -c "error" /tmp/eslint.log 2>/dev/null || echo "?")
        log_fail "ESLint: erreurs détectées ($LINT_ERRORS lignes avec 'error')"
        log_info "Voir /tmp/eslint.log"
    fi
else
    log_info "Pas de config ESLint — skip"
fi
echo ""

# ============================================================
# SECTION 5: TESTS
# ============================================================
echo "🧪 SECTION 5 — Tests"
echo "--------------------------------------------"

cd "$BACKEND_DIR"
if [ -d "__tests__" ] || ls *.test.js *.spec.js 2>/dev/null | grep -q .; then
    if npm test > /tmp/tests.log 2>&1; then
        log_pass "Tests backend OK"
    else
        log_fail "Tests backend: échecs détectés"
        log_info "Voir /tmp/tests.log"
    fi
else
    log_info "Pas de tests backend trouvés — skip"
fi

# Tests frontend
cd "$FRONTEND_DIR"
if ls src/**/*.test.* src/**/*.spec.* 2>/dev/null | grep -q .; then
    if npx jest > /tmp/tests-frontend.log 2>&1; then
        log_pass "Tests frontend OK"
    else
        log_fail "Tests frontend: échecs détectés"
        log_info "Voir /tmp/tests-frontend.log"
    fi
else
    log_info "Pas de tests frontend trouvés — skip"
fi
echo ""

# ============================================================
# SECTION 6: CODE MORT
# ============================================================
echo "🧹 SECTION 6 — Code mort"
echo "--------------------------------------------"

cd "$PROJECT_DIR"

# TODO / FIXME
TODOS=$(grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=.next --exclude="package-lock.json" 2>/dev/null || true)
if [ -n "$TODOS" ]; then
    TODO_COUNT=$(echo "$TODOS" | wc -l)
    log_warn "$TODO_COUNT marqueurs TODO/FIXME trouvés"
    echo "$TODOS" | head -10 | while read -r line; do log_info "$line"; done
    if [ "$TODO_COUNT" -gt 10 ]; then log_info "... et $((TODO_COUNT - 10)) autres"; fi
else
    log_pass "Aucun TODO/FIXME"
fi

# console.log oubliés
CONSOLE_LOGS=$(grep -rn "console\.log\|console\.warn\|console\.debug" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=.next --exclude="package-lock.json" 2>/dev/null || true)
if [ -n "$CONSOLE_LOGS" ]; then
    LOG_COUNT=$(echo "$CONSOLE_LOGS" | wc -l)
    log_warn "$LOG_COUNT console.log/warn/debug oubliés"
    echo "$CONSOLE_LOGS" | head -5 | while read -r line; do log_info "$line"; done
else
    log_pass "Aucun console.log oublié"
fi
echo ""

# ============================================================
# SECTION 7: COHÉRENCE DES FICHIERS
# ============================================================
echo "📁 SECTION 7 — Fichiers clés présents"
echo "--------------------------------------------"

cd "$PROJECT_DIR"
KEY_FILES=(
    "frontend/package.json"
    "frontend/next.config.js"
    "frontend/tsconfig.json"
    "backend/package.json"
    "backend/src/index.js"
    "backend/src/routes/auth.js"
    "backend/src/routes/wallet.js"
    "backend/src/controllers/authController.js"
    "backend/src/controllers/walletController.js"
    "migrations.sql"
)

for f in "${KEY_FILES[@]}"; do
    if [ -f "$f" ]; then
        log_pass "$f"
    else
        log_fail "$f MANQUANT"
    fi
done
echo ""

# ============================================================
# SECTION 8: GIT STATUS
# ============================================================
echo "📦 SECTION 8 — Git"
echo "--------------------------------------------"

cd "$PROJECT_DIR"
UNCOMMITTED=$(git status --porcelain 2>/dev/null || true)
if [ -z "$UNCOMMITTED" ]; then
    log_pass "Working tree clean — tout est commité"
else
    UNCOMMITTED_COUNT=$(echo "$UNCOMMITTED" | wc -l)
    log_warn "$UNCOMMITTED_COUNT fichiers non commités"
    echo "$UNCOMMITTED" | head -10 | while read -r line; do log_info "$line"; done
fi

LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "aucun commit")
log_info "Dernier commit: $LAST_COMMIT"
echo ""

# ============================================================
# RAPPORT FINAL
# ============================================================
echo ""
echo "============================================"
echo "  RÉSUMÉ"
echo "============================================"
echo -e "  ${GREEN}PASS: $pass${NC}  |  ${RED}FAIL: $fail${NC}  |  ${YELLOW}WARN: $warn${NC}"
echo ""

if [ "$fail" -gt 0 ]; then
    echo -e "${RED}⚠️  PROBLÈMES DÉTECTÉS — voir le rapport complet${NC}"
elif [ "$warn" -gt 0 ]; then
    echo -e "${YELLOW}✅ Tout fonctionne, mais des warnings à voir${NC}"
else
    echo -e "${GREEN}🎉 TOUT EST SAIN — rien à signaler${NC}"
fi

echo ""
echo "Rapport complet généré dans /tmp/ pour concaténation"
echo "PASS=$pass FAIL=$fail WARN=$warn" > /tmp/diagnostic-summary.txt
