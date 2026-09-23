import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://arbyter-os-qy.vercel.app'
  return { rules: { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/settings/', '/api/', '/playground/'] }, sitemap: `${base}/sitemap.xml` }
}
