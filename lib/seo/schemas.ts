import { SITE } from "./config"

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE.baseUrl}/#organization`,
  name: SITE.legalName,
  alternateName: SITE.name,
  url: SITE.baseUrl,
  email: SITE.email,
  description: SITE.description,
  logo: { "@type": "ImageObject", url: `${SITE.baseUrl}/arbyter-logo.svg` },
  sameAs: ["https://www.reddit.com/u/arbyter-os", "https://www.instagram.com/arbyter.in"],
}

export const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${SITE.baseUrl}/#software`,
  name: SITE.name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: SITE.description,
  url: SITE.baseUrl,
  publisher: { "@id": `${SITE.baseUrl}/#organization` },
}

export function websiteSchema() {
  return { "@context": "https://schema.org", "@type": "WebSite", "@id": `${SITE.baseUrl}/#website`, name: SITE.name, url: SITE.baseUrl, description: SITE.description, publisher: { "@id": `${SITE.baseUrl}/#organization` } }
}

export function breadcrumbSchema(pathname: string) {
  const parts = pathname.split("/").filter(Boolean)
  if (!parts.length) return null
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Arbyter", item: SITE.baseUrl }, ...parts.map((part, index) => ({ "@type": "ListItem", position: index + 2, name: part.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "), item: `${SITE.baseUrl}/${parts.slice(0, index + 1).join("/")}` }))] }
}
