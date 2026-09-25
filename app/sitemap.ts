import type { MetadataRoute } from "next"
import { SITE } from "@/lib/seo/config"
import { PUBLIC_SEO_ROUTES } from "@/lib/seo/routes"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return PUBLIC_SEO_ROUTES.map((route) => ({
    url: new URL(route, SITE.baseUrl).toString(),
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }))
}
