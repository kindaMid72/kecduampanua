import { test, expect } from '@playwright/test';

// Aturan Wajib: Uji viewport 360px (mobile sempit)

test.describe('Viewport 360px (Mobile)', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  test('Navbar mobile tidak overflow di 360px', async ({ page }) => {
    await page.goto('/id');
    
    // Pastikan tidak ada horizontal scroll
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    
    expect(isOverflowing).toBeFalsy();

    // Buka menu hamburger
    await page.getByLabel('Buka menu').click();
    await expect(page.getByRole('navigation', { name: 'Navigasi mobile' })).toBeVisible();

    // Cek dropdown menu (contoh: Profil)
    await page.getByText('Profil').click();
    await expect(page.getByRole('link', { name: 'Sejarah & Visi-Misi' })).toBeVisible();
  });

  test('Papan Informasi di Beranda responsif di 360px', async ({ page }) => {
    await page.goto('/id');
    
    // Pastikan Papan Informasi terlihat dan tidak terpotong
    const papanPanel = page.locator('text=Papan Informasi').first();
    await expect(papanPanel).toBeVisible();
  });
});
