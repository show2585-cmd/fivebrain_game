import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { FAQ, SITE } from './src/seo/content'

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// <script> 안에 넣어도 안전한 JSON
const safeJson = (data: unknown) => JSON.stringify(data, null, 2).replace(/</g, '\\u003c')

function structuredData(url: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE.name,
        url,
        description: SITE.description,
        inLanguage: 'ko-KR',
      },
      {
        '@type': 'VideoGame',
        name: SITE.name,
        alternateName: SITE.tagline,
        url,
        image: `${url}og-image.png`,
        description: SITE.description,
        genre: ['미니게임', '카드게임', '반응속도 게임', '두뇌게임'],
        keywords: SITE.keywords.join(', '),
        gamePlatform: ['Web browser', 'PC', 'Mobile'],
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any',
        playMode: 'SinglePlayer',
        numberOfPlayers: { '@type': 'QuantitativeValue', value: 1 },
        inLanguage: 'ko-KR',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  }
}

// JS를 실행하지 않는 검색봇(네이버 등)도 읽을 수 있는 정적 본문. React가 마운트되면 교체된다.
function fallbackHtml() {
  const faq = FAQ.map(
    ({ q, a }) => `<h3 style="margin:20px 0 6px;font-size:16px">${escapeHtml(q)}</h3><p style="margin:0">${escapeHtml(a)}</p>`,
  ).join('')
  return `<main style="max-width:28rem;margin:0 auto;padding:40px 16px;color:#fff4d6;line-height:1.6;font-family:system-ui,sans-serif">
      <h1 style="font-size:40px;margin:0">${escapeHtml(SITE.name)}</h1>
      <p style="font-weight:700;margin:4px 0 16px">${escapeHtml(SITE.tagline)}</p>
      <p>${escapeHtml(SITE.description)}</p>
      <h2 style="font-size:20px;margin-top:28px">게임 방법</h2>
      <ul>
        <li>번갈아 가며 카드를 한 장씩 뒤집어요.</li>
        <li>펼쳐진 카드에서 한 과일의 합이 정확히 5개가 되면 종을 쳐요.</li>
        <li>먼저 친 사람이 펼쳐진 카드를 모두 가져가고, 잘못 치면 1장을 줘요.</li>
        <li>내 차례에 뒤집을 카드가 없으면 패배!</li>
      </ul>
      <h2 style="font-size:20px;margin-top:28px">자주 묻는 질문</h2>
      ${faq}
    </main>`
}

function seo(siteUrl: string): Plugin {
  const url = `${siteUrl.replace(/\/+$/, '')}/`
  const tokens: Record<string, string> = {
    SITE_URL: url,
    SITE_NAME: SITE.name,
    SITE_TITLE: SITE.title,
    SITE_TAGLINE: SITE.tagline,
    SITE_DESCRIPTION: SITE.description,
    SITE_KEYWORDS: SITE.keywords.join(', '),
  }
  return {
    name: 'seo',
    transformIndexHtml(html) {
      return html
        .replace(/\{\{(\w+)\}\}/g, (match, key: string) => (key in tokens ? escapeHtml(tokens[key]) : match))
        .replace('<!-- seo:jsonld -->', `<script type="application/ld+json">\n${safeJson(structuredData(url))}\n    </script>`)
        .replace('<!-- seo:fallback -->', fallbackHtml())
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${url}sitemap.xml\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  return {
    plugins: [react(), tailwindcss(), seo(env.VITE_SITE_URL || 'http://localhost:5173')],
  }
})
