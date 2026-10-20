import { test, expect } from '@playwright/test';

// Aturan Wajib (AGENTS.md): uji validasi form Pengaduan (kosong, tidak valid).
// Catatan: tes ini TIDAK mengirim laporan sungguhan. Pengiriman valid akan menulis ke database
// dan ikut menghabiskan batas kiriman, jadi hanya jalur honeypot (yang tidak menulis) yang diuji
// sampai selesai.

test.describe('Form pengaduan: validasi', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/id/kontak/pengaduan');
  });

  test('kirim dalam keadaan kosong menampilkan galat dan menandai field', async ({ page }) => {
    await page.getByRole('button', { name: 'Kirim Laporan' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Nama minimal 3 karakter' })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Kontak (Email/No HP) wajib diisi' })).toBeVisible();
    await expect(page.getByLabel('Nama Lengkap')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Nama Lengkap')).toHaveAttribute('aria-describedby', 'pengaduan-nama-galat');
  });

  test('kontak terlalu pendek ditolak', async ({ page }) => {
    await page.getByLabel('Nama Lengkap').fill('Budi Santoso');
    await page.getByLabel('Nomor HP / Email').fill('123');
    await page.getByRole('button', { name: 'Kirim Laporan' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Kontak (Email/No HP) wajib diisi' })).toBeVisible();
  });

  test('tanpa persetujuan data pribadi ditolak', async ({ page }) => {
    await page.getByLabel('Nama Lengkap').fill('Budi Santoso');
    await page.getByLabel('Nomor HP / Email').fill('08123456789');
    await page.getByLabel('Kategori Laporan').selectOption('infrastruktur');
    await page.getByLabel('Deskripsi Laporan').fill('Jalan berlubang di dusun satu sejak bulan lalu.');
    await page.getByRole('button', { name: 'Kirim Laporan' }).click();

    await expect(page.getByRole('alert').filter({ hasText: 'Anda harus menyetujui kebijakan privasi' })).toBeVisible();
  });

  test('honeypot terisi: tampil sukses palsu, tanpa pesan validasi', async ({ page }) => {
    // Kolom honeypot disembunyikan dari pengguna; bot biasanya tetap mengisinya.
    // React melacak nilai input; setter bawaan + event input membuat React melihat perubahan
    // (assignment el.value biasa tidak dihitung, jadi field tidak ikut terkirim).
    await page.locator('#pengaduan-honeypot').evaluate((el: HTMLInputElement) => {
      const setNilai = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      setNilai?.call(el, 'bot');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.getByLabel('Nama Lengkap').fill('Budi Santoso');
    await page.getByLabel('Nomor HP / Email').fill('08123456789');
    await page.getByLabel('Kategori Laporan').selectOption('infrastruktur');
    await page.getByLabel('Deskripsi Laporan').fill('Jalan berlubang di dusun satu sejak bulan lalu.');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Kirim Laporan' }).click();

    await expect(page.getByText('Laporan Berhasil Dikirim')).toBeVisible();
    // Next juga memakai role="alert" untuk announcer rute, jadi hanya cek galat validasi form.
    await expect(page.getByRole('alert').filter({ hasText: 'wajib' })).toHaveCount(0);
    await expect(page.getByRole('alert').filter({ hasText: 'minimal' })).toHaveCount(0);
  });
});
