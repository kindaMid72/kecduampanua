import { test, expect } from "@playwright/test";

test("halaman beranda bisa diakses", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Kecamatan Duampanua/);
});
