// Writes one real HTML file per tool so search engines can read each page
// without running JavaScript. Also writes sitemap.xml and robots.txt.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SEO, PAGES, SITE, HOWTO } from '../src/seo.js'
import { TOOL_META } from '../src/catalog.js'
import { iconSvg } from '../src/icons.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const today = new Date().toISOString().slice(0, 10)

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const base = readFileSync(join(dist, 'index.html'), 'utf8')

const seoSection = (data, id) => {
  const rel = (data.related || []).map((r) => TOOL_META.find((t) => t.id === r)).filter(Boolean)
  const steps = data.steps?.length
    ? `<h2 class="seo-h">${esc(HOWTO[id] || `How to use ${data.h1.toLowerCase()}`)}</h2>` +
      `<ol class="seo-steps">${data.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`
    : ''
  const faq = data.faq?.length
    ? `<h2 class="seo-h">Frequently asked questions</h2>` +
      `<div class="seo-faq">${data.faq
        .map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`)
        .join('')}</div>`
    : ''
  const links = rel.length
    ? `<h2 class="seo-h">Related tools</h2>` +
      `<div class="seo-rel">${rel
        .map((t) => `<a href="/${t.id}">${iconSvg(t.icon)} ${esc(t.title)}</a>`)
        .join('')}</div>`
    : ''
  return `<section class="seo"><p class="seo-lead">${esc(data.intro)}</p>${steps}${faq}${links}</section>`
}

const toolBody = (meta, data) => `
<main>
  <div class="shell">
    <button class="back rise" type="button">${iconSvg('arrowLeft')} All tools</button>
    <h1 class="rise">${iconSvg(meta.icon)} ${esc(meta.title)}</h1>
    <p class="lead rise">${esc(meta.desc)}</p>
    <div class="panel rise"></div>
    ${seoSection(data, meta.id)}
  </div>
</main>`

const homeBody = (data) => `
<main>
  <div class="hero">
    <h1>${esc(data.h1)}</h1>
    <p class="sub">${esc(SITE.description)}</p>
  </div>
  <section>
    <h4 class="heading">All tools</h4>
    <div class="tools">
      ${TOOL_META.map(
        (t) =>
          `<a class="tool" href="/${t.id}"><div class="ico">${iconSvg(t.icon)}</div><h3>${esc(
            t.title,
          )}</h3><p>${esc(t.desc)}</p></a>`,
      ).join('\n      ')}
    </div>
  </section>
  ${seoSection(data)}
</main>`

const jsonLd = (data, url) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: data.title,
      url,
      description: data.desc,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires JavaScript',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    },
    {
      '@type': 'FAQPage',
      mainEntity: (data.faq || []).map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'PDF Studio', item: SITE.url },
        { '@type': 'ListItem', position: 2, name: data.h1, item: url },
      ],
    },
  ],
})

const render = (data, body, path, image) => {
  const url = SITE.url + path
  const ld = JSON.stringify(jsonLd(data, url))
  let html = base
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(data.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${esc(data.desc)}" />`)
    .replace(/<meta property="og:title"[\s\S]*?\/>/, `<meta property="og:title" content="${esc(data.title)}" />`)
    .replace(
      /<meta\s+property="og:description"[\s\S]*?\/>/,
      `<meta property="og:description" content="${esc(data.desc)}" />`,
    )
    .replace(
      /<\/head>/,
      `  <link rel="canonical" href="${url}" />\n` +
        `    <meta property="og:url" content="${url}" />\n` +
        `    <meta property="og:image" content="${SITE.url}${image}" />\n` +
        `    <meta name="twitter:card" content="summary_large_image" />\n` +
        `    <meta name="twitter:title" content="${esc(data.title)}" />\n` +
        `    <meta name="twitter:description" content="${esc(data.desc)}" />\n` +
        `    <meta name="twitter:image" content="${SITE.url}${image}" />\n` +
        `    <script type="application/ld+json">${ld}</script>\n  </head>`,
    )
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
  return html
}

const written = []

// Home page
const home = PAGES[0]
writeFileSync(join(dist, 'index.html'), render(home, homeBody(home), '/', '/og/home.png'))
written.push({ path: '/', priority: '1.0' })

// One page per tool
for (const meta of TOOL_META) {
  const data = SEO[meta.id]
  if (!data) continue
  const dir = join(dist, meta.id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), render(data, toolBody(meta, data), '/' + meta.id, `/og/${meta.id}.png`))
  written.push({ path: '/' + meta.id, priority: '0.9' })
}

// sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${written
  .map(
    (u) =>
      `  <url>\n    <loc>${SITE.url}${u.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)

// robots.txt
writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`,
)

console.log(`prerendered ${written.length} pages + sitemap.xml + robots.txt`)
