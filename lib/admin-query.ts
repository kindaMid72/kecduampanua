/**
 * Helper untuk pagination & filter di admin dashboard.
 * Semua halaman list admin menggunakan fungsi ini agar konsisten.
 */

export const ADMIN_PAGE_SIZE = 10;

/** Parsing searchParams Next.js App Router ke nilai yang aman */
export function parseAdminParams(searchParams: Record<string, string | string[] | undefined>) {
  const search = ((searchParams.search as string) || "").trim();
  const page = Math.max(1, parseInt((searchParams.page as string) || "1", 10));
  return { search, page, pageSize: ADMIN_PAGE_SIZE };
}

/** Konversi page number ke range Supabase (.range(from, to)) */
export function pageToRange(page: number, pageSize: number = ADMIN_PAGE_SIZE) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

/** Hitung total halaman dari jumlah data */
export function calcTotalPages(count: number | null, pageSize: number = ADMIN_PAGE_SIZE) {
  return Math.max(1, Math.ceil((count ?? 0) / pageSize));
}
