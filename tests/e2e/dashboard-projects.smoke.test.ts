import { expect, test } from '@playwright/test';

/**
 * E2E Smoke Test: Dashboard Projects Page
 * 
 * Verifies that /dashboard/projects loads and renders data without request storms.
 * 
 * Prerequisites:
 * - E2E_BYPASS_AUTH=true (auth bypass enabled)
 * - NEXT_PUBLIC_AUTH_MODE=relaxed
 * - ALLOW_RELAXED_AUTH=true
 * - CORSO_USE_MOCK_DB=true
 * - DISABLE_RATE_LIMIT=true
 * 
 * All env vars are set by playwright.config.ts webServer configuration.
 */
test.describe('Dashboard Projects Page - Smoke Test', () => {
  test('should load projects page and display results', async ({ page }) => {
    // Navigate to projects page
    await page.goto('/dashboard/projects');

    // Wait for the page to be fully loaded
    // The grid should appear once data is loaded
    await page.waitForLoadState('networkidle');

    // Check that the entity grid container is present
    const gridContainer = page.getByTestId('entity-grid');
    await expect(gridContainer).toBeVisible({ timeout: 10000 });

    // Check that results count badge is visible (indicates data loaded)
    const resultsCount = page.getByTestId('entity-results-count');
    await expect(resultsCount).toBeVisible({ timeout: 10000 });

    // Verify results count contains "results" text
    await expect(resultsCount.locator('text=results')).toBeVisible();

    // Verify the results count badge shows a number
    const badgeText = await resultsCount.locator('div').first().textContent();
    expect(badgeText).toBeTruthy();
    expect(badgeText?.trim()).not.toBe('0');

    // Verify no infinite spinners or loading states persist
    // (AG Grid should have finished loading)
    const spinners = page.locator('[role="progressbar"], [aria-busy="true"]');
    const spinnerCount = await spinners.count();
    // Allow some spinners during initial load, but they should be gone by now
    expect(spinnerCount).toBeLessThan(3);

    // Verify page is stable (no excessive network requests)
    // This is implicitly checked by networkidle above, but we can also verify
    // that the page doesn't keep making requests
    await page.waitForTimeout(2000); // Wait 2 seconds to ensure stability
    // If there were request storms, networkidle would not have been reached
  });

  test('should not redirect to sign-in when auth bypass is enabled', async ({ page }) => {
    // Navigate directly to projects page
    await page.goto('/dashboard/projects');

    // Should not redirect to sign-in
    await expect(page).not.toHaveURL(/\/sign-in/);
    
    // Should be on projects page
    await expect(page).toHaveURL(/\/dashboard\/projects/);
  });

  test('should handle invalid query parameters gracefully', async ({ page }) => {
    // Navigate with invalid sort/filter params (should be ignored)
    await page.goto('/dashboard/projects?sortBy=invalid_field&filters=[{"field":"invalid","op":"eq","value":"x"}]');

    // Page should still load successfully
    await page.waitForLoadState('networkidle');

    // Grid should still be visible
    const gridContainer = page.getByTestId('entity-grid');
    await expect(gridContainer).toBeVisible({ timeout: 10000 });

    // Results should still be shown (invalid params are ignored)
    const resultsCount = page.getByTestId('entity-results-count');
    await expect(resultsCount).toBeVisible({ timeout: 10000 });
  });
});

