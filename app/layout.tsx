import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Manrope } from 'next/font/google'
import { JsonLd } from '@/components/seo/JsonLd'
import { organizationSchema, softwareSchema } from '@/lib/seo/schemas'
import './globals.css'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-display' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://arbyter-os-qy.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Arbyter — Intelligence Meets Governance', template: '%s | Arbyter' },
  description: 'Arbyter is the runtime governance layer between organizations and their AI agents.',
  alternates: { canonical: '/' },
  openGraph: { title: 'Arbyter — Intelligence Meets Governance', description: 'The runtime governance layer between organizations and their AI agents.', url: '/', siteName: 'Arbyter', type: 'website', images: [{ url: '/og/default.svg', width: 1200, height: 630, alt: 'Arbyter — Intelligence Meets Governance' }] },
  twitter: { card: 'summary_large_image', title: 'Arbyter — Intelligence Meets Governance', description: 'The runtime governance layer between organizations and their AI agents.', images: ['/og/default.svg'] },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#050505' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark bg-black ${manrope.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <JsonLd data={organizationSchema} />
        <JsonLd data={softwareSchema} />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
