import { expect, test, vi, beforeEach } from "vitest";
import BeritaDetailPage from "@/app/[locale]/(public)/berita/[slug]/page";
import InformasiDetailPage from "@/app/[locale]/(public)/informasi/[slug]/page";

// Query detail hanya memakai chain .select().eq().eq().limit().single()
const single = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => ({ single }),
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

// notFound() di Next melempar error internal; meniru perilakunya dengan pesan yang bisa dicek.
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const params = (slug: string) => Promise.resolve({ locale: "id", slug });

const pages = [
  { name: "berita", render: BeritaDetailPage },
  { name: "informasi", render: InformasiDetailPage },
];

beforeEach(() => {
  single.mockReset();
});

for (const { name, render } of pages) {
  test(`${name}: slug tidak ada (PGRST116) menghasilkan 404`, async () => {
    single.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116", message: "Cannot coerce the result to a single JSON object" },
    });

    await expect(render({ params: params("tidak-ada") })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  test(`${name}: error database TIDAK disamarkan sebagai 404`, async () => {
    single.mockResolvedValueOnce({
      data: null,
      error: { code: "", message: "Invalid API key" },
    });

    const err = await render({ params: params("apa-saja") }).catch((e) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).not.toBe("NEXT_NOT_FOUND");
    expect(err.message).toContain("Invalid API key");
  });

  test(`${name}: data ditemukan dirender tanpa error`, async () => {
    single.mockResolvedValueOnce({
      data: {
        id: "1",
        judul: "Judul Uji",
        judul_en: null,
        konten: "Isi uji",
        konten_en: null,
        kategori: "pengumuman",
        gambar_cover_url: null,
        created_at: "2026-01-01T00:00:00Z",
        slug: "judul-uji",
        tanggal_acara: null,
        lokasi: null,
      },
      error: null,
    });

    const element = await render({ params: params("judul-uji") });
    expect(element).toBeTruthy();
  });
}
