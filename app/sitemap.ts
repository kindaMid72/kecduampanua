import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duampanua.go.id';
  const supabase = await createClient();
  
  // Public static routes
  const staticRoutes = [
    '',
    '/profil',
    '/profil/ppid',
    '/profil/data-statistik',
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

  // Dynamic Berita
  const { data: berita } = await supabase
    .from('berita')
    .select('slug, updated_at')
    .eq('status', 'published');

  if (berita) {
    berita.forEach((b) => {
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
  }

  // Dynamic Informasi Publik
  const { data: informasi } = await supabase
    .from('informasi_publik')
    .select('slug, updated_at')
    .eq('status', 'published');

  if (informasi) {
    informasi.forEach((info) => {
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
  }

  return routes;
}
