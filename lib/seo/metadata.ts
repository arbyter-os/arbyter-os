import type { Metadata } from "next"
import { SITE } from "./config"

export function pageMetadata(title: string, description: string, path = "/"): Metadata {
  const canonical = new URL(path || "/", SITE.baseUrl).toString().replace(/\/$/, path === "/" ? "/" : "")
  return {
    title,
    description,
    metadataBase: new URL(SITE.baseUrl),
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: SITE.name, type: "website", images: [{ url: "/og/default.svg", width: 1200, height: 630, alt: "Arbyter — Intelligence Meets Governance" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og/default.svg"] },
  }
}
