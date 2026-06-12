#!/bin/bash
# ============================================================
# Stamply — Script maître de diagnostic nocturne
# Lance: diagnostic.sh + playwright, génère un rapport horodaté
# Mode: lecture seule, aucune modification, aucun push
# ============================================================

set -uo pipefail

PROJECT_DIR="/home/ubuntu/stamply/wallet-saas-main"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
REPORT_DIR="$PROJECT_DIR/diagnostics"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
REPORT_FILE="$REPORT_DIR/rapport-$TIMESTAMP.md"

mkdir -p "$REPORT_DIR"

echo ""
echo "🌙 Diagnostic nocturne Stamply — $(date +"%d/%m/%Y %H:%M")"
echo ""

# ============================================================
# PARTIE 1: DIAGNOSTIC TECHNIQUE
# ============================================================
echo "📋 Partie 1 — Diagnostic technique"
echo "=================================="
echo ""

cd "$SCRIPTS_DIR"
bash diagnostic.sh 2>&1 | tee /tmp/diagnostic-output.txt

# Récupérer le résumé
DIAG_PASS=$(grep "^PASS=" /tmp/diagnostic-summary.txt | cut -d= -f2)
DIAG_FAIL=$(grep "^FAIL=" /tmp/diagnostic-summary.txt | cut -d= -f2)
DIAG_WARN=$(grep "^WARN=" /tmp/diagnostic-summary.txt | cut -d= -f2)

echo ""
echo "⏳ Diagnostic technique terminé"
echo ""

# ============================================================
# PARTIE 2: TESTS UX (PLAYWRIGHT)
# ============================================================
echo "📋 Partie 2 — Tests UX (Playwright)"
echo "=================================="
echo ""

cd "$SCRIPTS_DIR"
npx playwright test --config=playwright.config.js test-ux.spec.js 2>&1 | tee /tmp/playwright-output.txt

PLAYWRIGHT_EXIT=$?
PLAYWRIGHT_SUMMARY=$(grep -E "passed|failed" /tmp/playwright-output.txt | tail -1 || echo "résultat non disponible")

echo ""
echo "⏳ Tests UX terminés (exit code: $PLAYWRIGHT_EXIT)"
echo ""

# ============================================================
# GÉNÉRATION DU RAPPORT
# ============================================================
echo "📝 Génération du rapport..."

cat > "$REPORT_FILE" << RAPPORT
# 🔍 Rapport de diagnostic Stamply — $(date +"%d/%m/%Y %H:%M")

## Résumé

| | Technique | UX (Playwright) |
|---|---|---|
| ✅ Pass | ${DIAG_PASS:-?} | à extraire |
| ❌ Fail | ${DIAG_FAIL:-?} | à extraire |
| ⚠️ Warn | ${DIAG_WARN:-?} | — |

## Partie 1 — Diagnostic technique

\`\`\`
$(cat /tmp/diagnostic-output.txt)
\`\`\`

## Partie 2 — Tests UX

\`\`\`
$(cat /tmp/playwright-output.txt)
\`\`\`

---
*Généré automatiquement — aucun fichier modifié*
RAPPORT

echo ""
echo "============================================"
echo "  RAPPORT GÉNÉRÉ"
echo "============================================"
echo "  Fichier : $REPORT_FILE"
echo "  Technique: PASS=$DIAG_PASS FAIL=$DIAG_FAIL WARN=$DIAG_WARN"
echo "  Playwright: exit=$PLAYWRIGHT_EXIT"
echo "============================================"
echo ""

# Copier aussi dans /tmp pour accès facile
cp "$REPORT_FILE" /tmp/rapport-latest.md
echo "Copié dans /tmp/rapport-latest.md"
