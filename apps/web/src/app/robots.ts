import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/dashboard', '/seller/dashboard', '/checkout'],
    },
    sitemap: 'https://hydraflow-aqua.com/sitemap.xml',
  };
}
