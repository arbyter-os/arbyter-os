import type { Metadata } from 'next'
import { SITE } from './config'

export function pageMetadata(title: string, description: string, path = '/'): Metadata {
  const canonical = `${SITE.baseUrl}${path}`
  return {
    title,
    description,
    metadataBase: new URL(SITE.baseUrl),
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: SITE.name, type: 'website', images: [{ url: '/og/default.svg', width: 1200, height: 630, alt: 'Arbyter' }] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og/default.svg'] },
  }
}
