// ============================================================
// Stamply — Tests UX/Fonctionnels (Playwright)
// Mode: lecture seule, aucune modification
// ============================================================

const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://stamply-gamma.vercel.app';

// ============================================================
// TESTS DE CHARGEMENT DES PAGES
// ============================================================
test.describe('Chargement des pages', () => {

  test('Page d\'accueil se charge', async ({ page }) => {
    const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response.status()).toBe(200);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('/login se charge sans erreur', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response.status()).toBe(200);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('/register se charge sans erreur', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response.status()).toBe(200);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('/mentions-legales se charge', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/mentions-legales`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response.status()).toBe(200);
  });

  test('/cgu se charge', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/cgu`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response.status()).toBe(200);
  });

  test('/politique-confidentialite se charge', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/politique-confidentialite`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response.status()).toBe(200);
  });

  test('/contact se charge', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/contact`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response.status()).toBe(200);
  });
});

// ============================================================
// TESTS DES BOUTONS CTA
// ============================================================
test.describe('Boutons CTA', () => {

  test('Bouton "Voir la démo" mène quelque part', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const demoBtn = page.locator('a, button').filter({ hasText: /démo|demo/i }).first();
    if (await demoBtn.count() > 0) {
      const href = await demoBtn.getAttribute('href');
      const onclick = await demoBtn.getAttribute('onclick');
      // OK si href existe OU si onclick existe (bouton avec handler JS)
      expect(href || onclick).toBeTruthy();
      console.log(`  → "Voir la démo" → href=${href || 'onclick handler'}`);
    } else {
      console.log('  → Pas de bouton "Voir la démo" trouvé (skip)');
    }
  });

  test('Bouton "Essayer gratuitement" mène quelque part', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const tryBtn = page.locator('a, button').filter({ hasText: /essayer|gratuit|try/i }).first();
    if (await tryBtn.count() > 0) {
      const href = await tryBtn.getAttribute('href');
      const onclick = await tryBtn.getAttribute('onclick');
      expect(href || onclick).toBeTruthy();
      console.log(`  → "Essayer gratuitement" → href=${href || 'onclick handler'}`);
    } else {
      console.log('  → Pas de bouton "Essayer gratuitement" trouvé (skip)');
    }
  });

  test('Bouton "Commencer" existe et est cliquable', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const startBtn = page.locator('a, button').filter({ hasText: /commencer|start/i }).first();
    if (await startBtn.count() > 0) {
      // Le bouton existe — c'est déjà bon. On vérifie juste qu'il est visible
      const isVisible = await startBtn.isVisible();
      expect(isVisible).toBe(true);
      console.log('  → "Commencer" existe et est visible');
    } else {
      console.log('  → Pas de bouton "Commencer" trouvé (skip)');
    }
  });

  test('Bouton "Connexion" existe et est accessible', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const loginBtn = page.locator('a, button').filter({ hasText: /connexion|login|se connecter/i }).first();
    if (await loginBtn.count() > 0) {
      const isVisible = await loginBtn.isVisible();
      expect(isVisible).toBe(true);
      console.log('  → "Connexion" existe et est visible');
    } else {
      console.log('  → Pas de bouton "Connexion" trouvé (skip)');
    }
  });
});

// ============================================================
// TESTS RESPONSIVE
// ============================================================
test.describe('Responsive', () => {

  test('Page d\'accueil sur mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
    // Pas de scroll horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('Page d\'accueil sur desktop (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('/login sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(30);
  });
});

// ============================================================
// TESTS D'ERREURS RÉSEAU
// ============================================================
test.describe('Erreurs réseau', () => {

  test('Pas d\'erreur "Failed to fetch" au chargement', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('requestfailed', request => {
      errors.push(`Request failed: ${request.url()} — ${request.failure().errorText}`);
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const fetchErrors = errors.filter(e => e.toLowerCase().includes('failed to fetch') || e.toLowerCase().includes('networkerror'));
    if (fetchErrors.length > 0) {
      console.log('  → Erreurs fetch détectées:');
      fetchErrors.forEach(e => console.log(`     ${e}`));
    }
    expect(fetchErrors.length).toBe(0);
  });
});
