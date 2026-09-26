import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { headers } from "next/headers"
import { Geist_Mono, Manrope } from "next/font/google"
import { JsonLd } from "@/components/seo/JsonLd"
import { organizationSchema, softwareSchema, websiteSchema } from "@/lib/seo/schemas"
import { SITE } from "@/lib/seo/config"
import { SEO_ROUTES } from "@/lib/seo/routes"
import "./globals.css"

const manrope = Manrope({ subsets: ["latin"], variable: "--font-display", display: "swap" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" })

function canonicalFor(pathname: string) {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "")
  return new URL(path, SITE.baseUrl).toString()
}

export async function generateMetadata(): Promise<Metadata> {
  const pathname = (await headers()).get("x-arbyter-pathname") || "/"
  const route = SEO_ROUTES[pathname]
  const title = route?.title || "Arbyter"
  const description = route?.description || SITE.description
  const canonical = canonicalFor(pathname)
  const noIndex = route?.noIndex ?? false

  return {
    metadataBase: new URL(SITE.baseUrl),
    title: { absolute: title },
    description,
    alternates: { canonical },
    icons: { icon: "/arbyter-logo.svg", apple: "/arbyter-logo.svg" },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      type: "website",
      images: [{ url: "/og/default.svg", width: 1200, height: 630, alt: "Arbyter — Intelligence Meets Governance" }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og/default.svg"] },
    robots: { index: !noIndex, follow: !noIndex },
  }
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f7f5" }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <JsonLd data={organizationSchema} />
        <JsonLd data={softwareSchema} />
        <JsonLd data={websiteSchema()} />
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
