import { test, expect } from "@playwright/test";

test("halaman beranda bisa diakses", async ({ page }) => {
  // Dibuka lewat /id: tanpa locale, Accept-Language browser (en-US) akan memilih /en.
  await page.goto("/id");
  await expect(page).toHaveTitle(/Kecamatan Duampanua/);
});
