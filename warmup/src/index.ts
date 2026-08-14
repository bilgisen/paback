/**
 * paback-warmup — keeps the paback worker's isolates warm so the first public
 * request after idle eviction doesn't pay the Payload/Next.js cold start.
 *
 * Deploy: `wrangler deploy` (from this directory).
 * The scheduled handler runs every 5 minutes (see wrangler.toml).
 */

const ENDPOINTS = [
  // Lite API — hot path for the frontend (astroblog service binding).
  'https://admin.paraanaliz.com/api/lite/news?limit=5',
  'https://admin.paraanaliz.com/api/lite/blog?limit=5',
  // Payload REST — keeps the full Payload path warm (admin/editors, local dev,
  // direct calls). Shares the same worker isolates.
  'https://admin.paraanaliz.com/api/news?depth=1&draft=true&trash=false&page=1&limit=5',
  'https://admin.paraanaliz.com/api/blog?depth=1&draft=true&trash=false&page=1&limit=5&sort=-publishedAt',
]

async function warm(): Promise<void> {
  await Promise.allSettled(
    ENDPOINTS.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { 'user-agent': 'paback-warmup', 'cache-control': 'no-cache' },
        })
        if (!res.ok) console.error('warmup failed', res.status, url)
      } catch (err) {
        console.error('warmup error', url, err)
      }
    }),
  )
}

export default {
  async scheduled(_controller: unknown, _env: unknown, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    ctx.waitUntil(warm())
  },
  async fetch() {
    return new Response('ok')
  },
}