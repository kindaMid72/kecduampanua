import { test, expect } from '@playwright/test';

// Aturan Wajib (AGENTS.md): setiap halaman publik diuji di viewport 360px.
// Cek utamanya: tidak ada scroll horizontal, dan halaman tidak render kosong atau error.

const rutePublik = [
  '/id',
  '/id/profil',
  '/id/profil/ppid',
  '/id/standar-pelayanan',
  '/id/informasi',
  '/id/berita',
  '/id/edaran-dokumen',
  '/id/potensi',
  '/id/kontak',
  '/id/kontak/pengaduan',
  '/en',
  '/en/profil',
  '/en/profil/ppid',
  '/en/standar-pelayanan',
  '/en/informasi',
  '/en/berita',
  '/en/edaran-dokumen',
  '/en/potensi',
  '/en/kontak',
  '/en/kontak/pengaduan',
];

test.describe('Halaman publik di viewport 360px', () => {
  test.use({ viewport: { width: 360, height: 640 } });

  for (const rute of rutePublik) {
    test(`${rute} tanpa scroll horizontal dan tidak error`, async ({ page }) => {
      const response = await page.goto(rute, { waitUntil: 'load' });
      expect(response?.status()).toBe(200);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(360);

      await expect(page.locator('main')).toBeVisible();
      await expect(page.getByText('Terjadi Kesalahan')).toHaveCount(0);
    });
  }
});

test.describe('Halaman tidak ditemukan', () => {
  test('URL tidak dikenal di bawah /id menampilkan 404 Bahasa Indonesia', async ({ page }) => {
    const response = await page.goto('/id/rute-tidak-ada');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Halaman Tidak Ditemukan' })).toBeVisible();
  });

  test('URL tidak dikenal di bawah /en menampilkan 404 Bahasa Inggris', async ({ page }) => {
    const response = await page.goto('/en/rute-tidak-ada');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
  });
});

test.describe('Aksesibilitas dasar', () => {
  test('skip link jadi fokus pertama dan menuju konten utama', async ({ page }) => {
    await page.goto('/id');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Lewati ke konten utama' });
    await expect(skip).toBeFocused();
    await expect(skip).toHaveAttribute('href', '#konten-utama');
  });
});
