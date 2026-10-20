import { notFound } from "next/navigation";

// Menangkap URL di bawah locale yang tidak cocok dengan rute mana pun
// (mis. /en/zzz). Tanpa ini, 404-nya jatuh ke not-found tingkat root (Bahasa Indonesia).
export default function CatchAllNotFound() {
  notFound();
}
