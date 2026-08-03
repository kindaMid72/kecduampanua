import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://duampanua.go.id';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Block search engines from indexing admin and APIs
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
