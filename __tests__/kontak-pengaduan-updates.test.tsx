import { render, screen, act } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import KontakPage from "@/app/[locale]/(public)/kontak/page";
import PengaduanPage from "@/app/[locale]/(public)/kontak/pengaduan/page";
import idMessages from "@/messages/id.json";

// Mock next-intl/server & next-intl
vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async ({ namespace }: { namespace?: string }) => {
    const nsObj = namespace
      ? (idMessages as Record<string, Record<string, string>>)[namespace]
      : (idMessages as unknown as Record<string, string>);
    return (key: string, values?: Record<string, string>) => {
      let text = nsObj?.[key] ?? key;
      if (values) {
        Object.entries(values).forEach(([k, v]) => {
          text = text.replace(new RegExp(`{${k}}`, "g"), v);
        });
      }
      return text;
    };
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => {
    const nsObj = (idMessages as Record<string, Record<string, string>>)[namespace];
    return (key: string) => {
      const parts = key.split(".");
      let val: any = nsObj;
      for (const p of parts) {
        val = val?.[p];
      }
      return val ?? key;
    };
  },
}));

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }))
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({}))
}));

test("KontakPage displays 'Buka di Google Maps' link", async () => {
  const jsx = await KontakPage({ params: Promise.resolve({ locale: "id" }) });
  render(jsx);

  const mapsLink = screen.getByRole("link", { name: /buka di google maps/i });
  expect(mapsLink).toBeInTheDocument();
  expect(mapsLink).toHaveAttribute("href", expect.stringContaining("google.com/maps"));
});

test("PengaduanPage renders SP4N-LAPOR heading with dark text color (text-primary)", async () => {
  const paramsPromise = Promise.resolve({ locale: "id" });
  await act(async () => {
    render(<PengaduanPage params={paramsPromise} />);
  });

  const heading = screen.getByRole("heading", { name: /sp4n-lapor!/i });
  expect(heading).toBeInTheDocument();
  expect(heading).toHaveClass("text-primary");
});
