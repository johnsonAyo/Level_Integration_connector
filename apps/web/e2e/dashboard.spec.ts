import { test, expect } from '@playwright/test';

test.describe('Workforce Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the dashboard and display essential elements', async ({ page }) => {
        // Check if the main title exists
        await expect(page.getByRole('heading', { name: 'Workforce Dashboard' })).toBeVisible();

        // Check if the sync summary card is present
        await expect(page.getByText('Sync Summary')).toBeVisible();

        // Check if the employee table is visible
        await expect(page.getByRole('table')).toBeVisible();
    });

    test('should filter employees by source', async ({ page }) => {
        const apiFilter = page.getByRole('button', { name: 'API', exact: true });
        const fileFilter = page.getByRole('button', { name: 'File', exact: true });

        // Click API filter
        await apiFilter.click();
        await expect(apiFilter).toHaveClass(/bg-white/); // Active state class

        // Check if the table updates (at least one row should be visible if mock API is running)
        // This is a basic check; real data depends on mock API state
        const rows = page.locator('tbody tr');
        const firstRowText = await rows.first().innerText();
        if (firstRowText.includes('No employees found')) {
            // If no data, at least verify the message
            await expect(page.locator('text=No employees found')).toBeVisible();
        }
    });

    test('should toggle earnings period', async ({ page }) => {
        const period3d = page.getByRole('button', { name: '3d' });
        const period7d = page.getByRole('button', { name: '7d' });
        const period1m = page.getByRole('button', { name: '1m' });

        await period3d.click();
        await expect(period3d).toHaveClass(/bg-white/);
        await expect(page.getByText('Last 3 Days Earnings')).toBeVisible();

        await period1m.click();
        await expect(period1m).toHaveClass(/bg-white/);
        await expect(page.getByText('Last Month Earnings')).toBeVisible();
    });

    test('should trigger sync and show notification', async ({ page }) => {
        // Open sync dropdown
        await page.getByRole('button', { name: 'Run Sync' }).click();

        // Trigger "Sync All Sources"
        await page.getByRole('menuitem', { name: 'Sync All Sources' }).click();

        // Check for the toast notification
        const toast = page.locator('li[data-sonner-toast]');
        await expect(toast).toBeVisible({ timeout: 10000 });
    });
});
