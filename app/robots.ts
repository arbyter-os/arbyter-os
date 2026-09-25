import type { MetadataRoute } from "next"
import { SITE } from "@/lib/seo/config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/playground/"],
    },
    sitemap: new URL("/sitemap.xml", SITE.baseUrl).toString(),
  }
}
