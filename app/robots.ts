import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

// Dinamis: NEXT_PUBLIC_SITE_URL bisa belum diset saat build (mis. preview Vercel).
// Kalau di-prerender, build gagal karena env itu.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const rules: MetadataRoute.Robots['rules'] = {
    userAgent: '*',
    allow: '/',
    disallow: ['/admin/', '/api/'], // Block search engines from indexing admin and APIs
  };

  try {
    return { rules, sitemap: `${getSiteUrl()}/sitemap.xml` };
  } catch (err) {
    // robots.txt tanpa baris Sitemap tetap valid. Lebih baik begitu daripada
    // menulis domain yang salah.
    console.error('robots: NEXT_PUBLIC_SITE_URL tidak tersedia, baris Sitemap dilewati.', err);
    return { rules };
  }
}
