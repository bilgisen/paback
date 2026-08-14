/**
 * paback-warmup — keeps the paback worker's isolates warm so the first public
 * request after idle eviction doesn't pay the Payload/Next.js cold start.
 *
 * Deploy: `wrangler deploy` (from this directory).
 * The scheduled handler runs every minute (see wrangler.toml).
 *
 * Only cheap lite endpoints are pinged: a single request loads the whole
 * worker bundle, so one fast call per minute is enough to keep every route
 * (lite + Payload REST) warm. Expensive `draft=true` REST pings were removed —
 * they add D1 load without keeping the isolate any warmer.
 */

const ENDPOINTS = [
  'https://admin.paraanaliz.com/api/lite/news?limit=5',
  'https://admin.paraanaliz.com/api/lite/blog?limit=5',
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