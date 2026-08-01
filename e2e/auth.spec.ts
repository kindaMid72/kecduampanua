import { test, expect } from '@playwright/test';

test.describe('Admin Auth Flow', () => {
  test('Redirects unauthenticated users to login page', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Harus di-redirect ke halaman login
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole('heading', { name: 'Masuk ke Panel Admin' })).toBeVisible();
  });

  test('Shows validation errors on empty login submit', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Submit kosong
    await page.getByRole('button', { name: 'Masuk' }).click();

    // Pastikan validasi Zod bekerja
    await expect(page.locator('#email-error')).toContainText('Email wajib diisi');
    await expect(page.locator('#password-error')).toContainText('Kata sandi wajib diisi');
  });

  test('Shows server error for invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123');
    
    await page.getByRole('button', { name: 'Masuk' }).click();

    // Alert error global
    await expect(page.getByRole('alert')).toContainText('Email atau kata sandi salah');
  });
});
