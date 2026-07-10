import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/dashboard', '/new-listing', '/history', '/settings'] },
    sitemap: 'https://snapsell.ai/sitemap.xml',
  };
}
