import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

// Wajib dinamis: createClient memakai cookies(). Tanpa ini, try/catch di bawah
// menelan sinyal DYNAMIC_SERVER_USAGE saat build dan sitemap jadi hanya rute statis.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://duampanua.go.id';

  // Public static routes
  const staticRoutes = [
    '',
    '/profil',
    '/profil/ppid',
    '/informasi',
    '/berita',
    '/standar-pelayanan',
    '/edaran-dokumen',
    '/potensi',
    '/kontak',
    '/kontak/pengaduan',
  ];

  const routes: MetadataRoute.Sitemap = staticRoutes.flatMap((route) => [
    {
      url: `${baseUrl}/id${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.8,
    },
    {
      url: `${baseUrl}/en${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.8,
    },
  ]);

  // Rute dinamis bersifat tambahan: jika DB gagal, sitemap tetap berisi rute statis
  // (sitemap tidak boleh 500 hanya karena Supabase sedang bermasalah).
  try {
    const supabase = await createClient();

    // Dynamic Berita
    const { data: berita } = await supabase
      .from('berita')
      .select('slug, updated_at')
      .eq('status', 'published');

    berita?.forEach((b) => {
      routes.push({
        url: `${baseUrl}/id/berita/${b.slug}`,
        lastModified: new Date(b.updated_at),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
      routes.push({
        url: `${baseUrl}/en/berita/${b.slug}`,
        lastModified: new Date(b.updated_at),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    });

    // Dynamic Informasi Publik
    const { data: informasi } = await supabase
      .from('informasi_publik')
      .select('slug, updated_at')
      .eq('status', 'published');

    informasi?.forEach((info) => {
      routes.push({
        url: `${baseUrl}/id/informasi/${info.slug}`,
        lastModified: new Date(info.updated_at),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
      routes.push({
        url: `${baseUrl}/en/informasi/${info.slug}`,
        lastModified: new Date(info.updated_at),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    });
  } catch (err) {
    console.error('sitemap: gagal memuat rute dinamis', err);
  }

  return routes;
}
