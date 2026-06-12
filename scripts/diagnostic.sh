#!/bin/bash
# ============================================================
# Stamply — Script de diagnostic nocturne
# Mode: lecture seule, aucune modification, aucun push
# ============================================================

# Ne PAS utiliser set -e — on veut que le script continue même si une étape échoue
set -uo pipefail

PROJECT_DIR="/home/ubuntu/stamply/wallet-saas-main"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
REPORT_DIR="$PROJECT_DIR/diagnostics"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
REPORT_FILE="$REPORT_DIR/rapport-$TIMESTAMP.md"

mkdir -p "$REPORT_DIR"

pass=0
fail=0
warn=0

log_pass() { ((pass++)); echo "  ✅ PASS  $1"; }
log_fail() { ((fail++)); echo "  ❌ FAIL  $1"; }
log_warn() { ((warn++)); echo "  ⚠️  WARN  $1"; }
log_info() { echo "     ℹ️  $1"; }

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
    log_fail "Build frontend — erreurs détectées"
    log_info "Dernières lignes du log :"
    tail -5 /tmp/build-frontend.log | while read -r line; do echo "     $line"; done
fi
echo ""

# ============================================================
# SECTION 2: SYNTAXE BACKEND
# ============================================================
echo "🔨 SECTION 2 — Backend"
echo "--------------------------------------------"

cd "$BACKEND_DIR"
if node --check src/index.js > /dev/null 2>&1; then
    log_pass "Syntaxe backend OK"
else
    log_fail "Syntaxe backend — erreur"
fi
echo ""

# ============================================================
# SECTION 3: TYPESCRIPT CHECK
# ============================================================
echo "🔍 SECTION 3 — TypeScript"
echo "--------------------------------------------"

cd "$FRONTEND_DIR"
if [ -f tsconfig.json ]; then
    if npx tsc --noEmit > /tmp/tsc.log 2>&1; then
        log_pass "TypeScript — aucune erreur"
    else
        TSC_ERRORS=$(wc -l < /tmp/tsc.log)
        log_fail "TypeScript — $TSC_ERRORS lignes d'erreurs"
        log_info "Premières erreurs :"
        head -8 /tmp/tsc.log | while read -r line; do echo "     $line"; done
    fi
else
    log_warn "Pas de tsconfig.json — skip"
fi
echo ""

# ============================================================
# SECTION 4: ESLINT
# ============================================================
echo "🔍 SECTION 4 — ESLint"
echo "--------------------------------------------"

cd "$FRONTEND_DIR"
if [ -f .eslintrc.json ] || [ -f .eslintrc.js ] || [ -f .eslintrc ]; then
    if npx eslint src/ --ext .ts,.tsx > /tmp/eslint.log 2>&1; then
        log_pass "ESLint — aucune erreur"
    else
        LINT_ERRORS=$(grep -c "error" /tmp/eslint.log 2>/dev/null || echo "?")
        log_fail "ESLint — erreurs détectées"
        log_info "Premières erreurs :"
        grep "error" /tmp/eslint.log | head -5 | while read -r line; do echo "     $line"; done
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
if [ -d "__tests__" ] || ls *.test.js *.spec.js 1>/dev/null 2>&1; then
    if npm test > /tmp/tests-backend.log 2>&1; then
        log_pass "Tests backend OK"
    else
        log_fail "Tests backend — échecs détectés"
        log_info "Dernières lignes :"
        tail -10 /tmp/tests-backend.log | while read -r line; do echo "     $line"; done
    fi
else
    log_info "Pas de tests backend — skip"
fi

cd "$FRONTEND_DIR"
if [ -d "__tests__" ] || ls src/**/*.test.* src/**/*.spec.* 1>/dev/null 2>&1; then
    if npx jest > /tmp/tests-frontend.log 2>&1; then
        log_pass "Tests frontend OK"
    else
        log_fail "Tests frontend — échecs détectés"
        log_info "Dernières lignes :"
        tail -10 /tmp/tests-frontend.log | while read -r line; do echo "     $line"; done
    fi
else
    log_info "Pas de tests frontend — skip"
fi
echo ""

# ============================================================
# SECTION 6: CODE MORT
# ============================================================
echo "🧹 SECTION 6 — Code mort"
echo "--------------------------------------------"

cd "$PROJECT_DIR"

TODOS=$(grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=.next --exclude="package-lock.json" 2>/dev/null || true)
if [ -n "$TODOS" ]; then
    TODO_COUNT=$(echo "$TODOS" | wc -l)
    log_warn "$TODO_COUNT marqueurs TODO/FIXME trouvés"
    echo "$TODOS" | head -8 | while read -r line; do echo "     $line"; done
    if [ "$TODO_COUNT" -gt 8 ]; then log_info "... et $((TODO_COUNT - 8)) autres"; fi
else
    log_pass "Aucun TODO/FIXME"
fi

CONSOLE_LOGS=$(grep -rn "console\.log\|console\.warn\|console\.debug" --include="*.ts" --include="*.tsx" --include="*.js" --exclude-dir=node_modules --exclude-dir=.next --exclude="package-lock.json" 2>/dev/null || true)
if [ -n "$CONSOLE_LOGS" ]; then
    LOG_COUNT=$(echo "$CONSOLE_LOGS" | wc -l)
    log_warn "$LOG_COUNT console.log/warn/debug oubliés"
    echo "$CONSOLE_LOGS" | head -5 | while read -r line; do echo "     $line"; done
else
    log_pass "Aucun console.log oublié"
fi
echo ""

# ============================================================
# SECTION 7: FICHIERS CLÉS
# ============================================================
echo "📁 SECTION 7 — Fichiers clés"
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
# SECTION 8: GIT
# ============================================================
echo "📦 SECTION 8 — Git"
echo "--------------------------------------------"

cd "$PROJECT_DIR"
UNCOMMITTED=$(git status --porcelain 2>/dev/null || true)
if [ -z "$UNCOMMITTED" ]; then
    log_pass "Working tree clean"
else
    UNCOMMITTED_COUNT=$(echo "$UNCOMMITTED" | wc -l)
    log_warn "$UNCOMMITTED_COUNT fichiers non commités"
    echo "$UNCOMMITTED" | head -8 | while read -r line; do echo "     $line"; done
fi

LAST_COMMIT=$(git log --oneline -1 2>/dev/null || echo "aucun commit")
log_info "Dernier commit : $LAST_COMMIT"
echo ""

# ============================================================
# RÉSUMÉ
# ============================================================
echo ""
echo "============================================"
echo "  RÉSUMÉ"
echo "============================================"
echo "  PASS: $pass  |  FAIL: $fail  |  WARN: $warn"
echo ""

if [ "$fail" -gt 0 ]; then
    echo "⚠️  PROBLÈMES DÉTECTÉS"
elif [ "$warn" -gt 0 ]; then
    echo "✅ Tout fonctionne, warnings à voir"
else
    echo "🎉 TOUT EST SAIN"
fi

echo ""
echo "PASS=$pass FAIL=$fail WARN=$warn" > /tmp/diagnostic-summary.txt
