import { expect, test } from '@playwright/test';

/**
 * E2E Smoke Test: Route Theme Application
 * 
 * Verifies that route themes are correctly applied via data-route-theme attribute
 * and that CSS custom properties are available.
 * 
 * Prerequisites:
 * - E2E_BYPASS_AUTH=true (for protected route test, if enabled)
 * - NEXT_PUBLIC_AUTH_MODE=relaxed
 * - All env vars are set by playwright.config.ts webServer configuration.
 */
test.describe('Route Theme Application - Smoke Test', () => {
  test('should apply auth theme on /sign-in', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Wait for DOM content to load (more reliable than networkidle)
    await page.waitForLoadState('domcontentloaded');
    
    // Poll for theme attribute (useEffect may take a moment)
    await expect.poll(async () => {
      return await page.evaluate(() => {
        return document.documentElement.dataset.routeTheme;
      });
    }, {
      message: 'data-route-theme should be set to "auth"',
      timeout: 5000,
    }).toBe('auth');
    
    // Verify CSS custom properties are applied
    const background = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--background')
        .trim();
    });
    expect(background).toBeTruthy();
    expect(background).not.toBe('');
    
    const foreground = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--foreground')
        .trim();
    });
    expect(foreground).toBeTruthy();
    expect(foreground).not.toBe('');
  });

  test('should apply marketing theme on /pricing', async ({ page }) => {
    await page.goto('/pricing');
    
    // Wait for DOM content to load
    await page.waitForLoadState('domcontentloaded');
    
    // Poll for theme attribute
    await expect.poll(async () => {
      return await page.evaluate(() => {
        return document.documentElement.dataset.routeTheme;
      });
    }, {
      message: 'data-route-theme should be set to "marketing"',
      timeout: 5000,
    }).toBe('marketing');
    
    // Verify CSS custom properties are applied
    const background = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--background')
        .trim();
    });
    expect(background).toBeTruthy();
    expect(background).not.toBe('');
    
    const foreground = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--foreground')
        .trim();
    });
    expect(foreground).toBeTruthy();
    expect(foreground).not.toBe('');
  });

  test('should apply protected theme on /dashboard (when auth bypass enabled)', async ({ page }) => {
    // Only run if auth bypass is enabled (set by playwright.config.ts)
    // If not enabled, this test will be skipped gracefully
    await page.goto('/dashboard');
    
    // Wait for navigation and DOM load
    await page.waitForLoadState('domcontentloaded');
    
    // If redirected to sign-in, skip this test (auth not bypassed)
    const url = page.url();
    if (url.includes('/sign-in')) {
      test.skip();
      return;
    }
    
    // Poll for theme attribute
    await expect.poll(async () => {
      return await page.evaluate(() => {
        return document.documentElement.dataset.routeTheme;
      });
    }, {
      message: 'data-route-theme should be set to "protected"',
      timeout: 5000,
    }).toBe('protected');
    
    // Verify CSS custom properties are applied
    const background = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--background')
        .trim();
    });
    expect(background).toBeTruthy();
    expect(background).not.toBe('');
  });

  test('should update theme attribute when navigating between routes', async ({ page }) => {
    // Start on marketing route
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    
    await expect.poll(async () => {
      return await page.evaluate(() => {
        return document.documentElement.dataset.routeTheme;
      });
    }).toBe('marketing');
    
    // Navigate to auth route
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');
    
    await expect.poll(async () => {
      return await page.evaluate(() => {
        return document.documentElement.dataset.routeTheme;
      });
    }).toBe('auth');
  });
});

