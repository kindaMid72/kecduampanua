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

  test('Shows invalid token message when accessing atur-kata-sandi without token', async ({ page }) => {
    await page.goto('/admin/atur-kata-sandi');

    // Menampilkan pesan tidak valid setelah verifikasi selesai
    await expect(page.getByRole('heading', { name: 'Tautan Tidak Valid' })).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole('button', { name: 'Kembali ke Halaman Login' })).toBeVisible();
  });

  test('Shows descriptive error when URL contains expired token error', async ({ page }) => {
    await page.goto('/admin/atur-kata-sandi?error=access_denied&error_code=otp_expired&error_description=Token+has+expired+or+is+invalid');

    await expect(page.getByRole('heading', { name: 'Tautan Tidak Valid' })).toBeVisible();
    await expect(page.getByText('sudah kedaluwarsa atau pernah digunakan')).toBeVisible();
  });
});

