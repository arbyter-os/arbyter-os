import { SITE } from './config'

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: SITE.baseUrl,
  description: SITE.description,
  logo: `${SITE.baseUrl}/favicon.ico`,
}

export const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: SITE.description,
  url: SITE.baseUrl,
}
