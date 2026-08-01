import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import ProfilPage from "@/app/[locale]/(public)/profil/page";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }))
}));

test("ProfilPage renders placeholders when data is null/empty", async () => {
  // @ts-expect-error Async Server Component rendering in test
  const jsx = await ProfilPage({ params: Promise.resolve({ locale: "id" }) });
  render(jsx);

  expect(screen.getByText("Sejarah kecamatan sedang diperbarui.")).toBeInTheDocument();
  expect(screen.getByText("Visi sedang diperbarui.")).toBeInTheDocument();
  expect(screen.getByText("Misi sedang diperbarui.")).toBeInTheDocument();
  expect(screen.getByText("Struktur organisasi sedang diperbarui.")).toBeInTheDocument();
  expect(screen.getByText("Data jumlah ASN sedang diperbarui.")).toBeInTheDocument();
});
