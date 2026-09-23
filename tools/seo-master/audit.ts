import { CONTENT_MAP } from './content-map.ts'

const required = Object.keys(CONTENT_MAP)
console.log('Arbyter SEO master audit')
console.log('Content domains:', required.join(', '))
console.log('Concept count:', Object.values(CONTENT_MAP).flat().length)
console.log('Next: verify each concept has a canonical page, useful visual explanation, metadata, structured data, and internal links.')
