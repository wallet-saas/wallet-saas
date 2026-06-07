#!/usr/bin/env python3
"""
Stamply API Test Suite
Tests all endpoints and reports results.
Run: python3 test_api.py
"""
import json, subprocess, sys, time

BASE = "https://stamply-backend-gn8z.onrender.com"
RESULTS = {"passed": 0, "failed": 0, "tests": []}

def load_creds():
    with open('/tmp/stamply_login.json') as f:
        d = json.load(f)
    return d['data']['token'], d['data']['commercant']['id']

def api(method, path, token=None, data=None, timeout=30):
    cmd = ["curl", "-s", "--max-time", str(timeout), "-X", method, BASE + path]
    if token:
        auth_header = "Authorization: Bearer *** + token
        cmd += ["-H", auth_header]
    if data:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout+5)
    try:
        return json.loads(r.stdout)
    except:
        return {"_raw": r.stdout[:200]}

def test(name, result, check_fn=None):
    if check_fn:
        ok = check_fn(result)
    else:
        ok = isinstance(result, dict) and result.get("success")
    
    status = "PASS" if ok else "fail"
    RESULTS["tests"].append({"name": name, "status": status})
    if ok:
        RESULTS["passed"] += 1
    else:
        RESULTS["failed"] += 1
        print(f"  [FAIL] {name}")
        print(f"        -> {json.dumps(result, ensure_ascii=False)[:200]}")
    return ok

def main():
    print("=" * 60)
    print("  STAMPLY API TEST SUITE")
    print("=" * 60)
    print()
    
    TOKEN, CID = load_creds()
    print(f"Token: {TOKEN[:20]}...")
    print(f"Commercant: {CID}")
    print()
    
    # ─── AUTH ──────────────────────────────────────────────
    print("--- AUTH ---")
    test("GET /auth/me", api("GET", "/auth/me", TOKEN))
    
    # ─── WALLET ────────────────────────────────────────────
    print("\n--- WALLET ---")
    test("POST /wallet/setup", api("POST", "/wallet/setup", TOKEN, {
        "template_metier": "boulangerie",
        "carte_programme_nom": "Fidélité Test",
        "carte_recompense_description": "10 visites = récompense",
        "carte_couleur_primaire": "#D97706",
        "points_recompense": 10
    }))
    test("POST /wallet/generate", api("POST", "/wallet/generate", TOKEN))
    test("GET /wallet/cartes", api("GET", "/wallet/cartes", TOKEN))
    test("POST /wallet/generate-for/:id", api("POST", f"/wallet/generate-for/{CID}"))
    
    # ─── SCAN ──────────────────────────────────────────────
    print("\n--- SCAN ---")
    test("POST /scan (invalid UUID)", api("POST", "/scan", TOKEN, {"pass_serial_number": "invalid"}),
         lambda r: r.get("success") == False)  # Expected: error
    test("GET /scan/history", api("GET", "/scan/history", TOKEN))
    
    # ─── NOTIFICATIONS ─────────────────────────────────────
    print("\n--- NOTIFICATIONS ---")
    test("POST /notifications/send", api("POST", "/notifications/send", TOKEN, {
        "titre": "Test",
        "message": "Test message",
        "cible": "tous"
    }))
    test("GET /notifications/history", api("GET", "/notifications/history", TOKEN))
    test("GET /notifications/stats", api("GET", "/notifications/stats", TOKEN))
    
    # ─── OFFRES ────────────────────────────────────────────
    print("\n--- OFFRES ---")
    test("POST /offres/create", api("POST", "/offres/create", TOKEN, {
        "titre": "Test Offre",
        "description": "-20%",
        "reduction_pct": 20
    }))
    test("GET /offres/list", api("GET", "/offres/list", TOKEN))
    
    # ─── ANALYTICS ─────────────────────────────────────────
    print("\n--- ANALYTICS ---")
    test("GET /analytics", api("GET", "/analytics", TOKEN))
    
    # ─── COMMERCANTS ───────────────────────────────────────
    print("\n--- COMMERCANTS ---")
    test("GET /commercants/me", api("GET", "/commercants/me", TOKEN))
    
    # ─── MENUS ─────────────────────────────────────────────
    print("\n--- MENUS ---")
    test("GET /menus/list", api("GET", "/menus/list", TOKEN))
    
    # ─── AVIS ──────────────────────────────────────────────
    print("\n--- AVIS ---")
    test("GET /avis/list", api("GET", "/avis/list", TOKEN))
    
    # ─── GEOLOCATION ───────────────────────────────────────
    print("\n--- GEOLOCATION ---")
    test("GET /geolocation/stats", api("GET", "/geolocation/stats", TOKEN))
    
    # ─── SUBSCRIPTION ──────────────────────────────────────
    print("\n--- SUBSCRIPTION ---")
    test("GET /subscription/status", api("GET", "/subscription/status", TOKEN),
         lambda r: r.get("success") and "data" in r)
    
    # ─── IMAGES ────────────────────────────────────────────
    print("\n--- IMAGES ---")
    test("GET /images/:id", api("GET", f"/images/{CID}"),
         lambda r: r.get("success") and "data" in r)
    
    # ─── SUMMARY ───────────────────────────────────────────
    total = RESULTS["passed"] + RESULTS["failed"]
    print()
    print("=" * 60)
    print(f"  RESULTS: {RESULTS['passed']}/{total} passed, {RESULTS['failed']} failed")
    print("=" * 60)
    
    if RESULTS["failed"] > 0:
        print("\nFailed tests:")
        for t in RESULTS["tests"]:
            if t["status"] == "fail":
                print(f"  - {t['name']}")
    
    return RESULTS["failed"] == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
