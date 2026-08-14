import { getCloudflareContext } from '@opennextjs/cloudflare'

/**
 * Lightweight public read API over D1.
 *
 * These routes intentionally do NOT import `@payload-config`. Importing it
 * executes `buildConfig()` (collections, lexical editor, admin import map)
 * on every cold start, which is the dominant part of paback's latency. By
 * running raw SQL against the D1 binding directly, cold starts stay cheap and
 * list queries avoid Payload's per-row relationship population (N+1).
 *
 * Only published rows are ever returned — mirrors `publicReadPublished`.
 */

export type CollectionName = 'news' | 'blog'

const SORT_OPTIONS: Record<string, [string, 'ASC' | 'DESC']> = {
  publishedAt: ['published_at', 'ASC'],
  '-publishedAt': ['published_at', 'DESC'],
  updatedAt: ['updated_at', 'ASC'],
  '-updatedAt': ['updated_at', 'DESC'],
  createdAt: ['created_at', 'ASC'],
  '-createdAt': ['created_at', 'DESC'],
}

const LIST_COLUMNS =
  'id, title, slug, category_id, author_id, featured_image_id, published_at, ' +
  'updated_at, created_at, status, seo_meta_title, seo_meta_description, seo_canonical_url'

interface Filters {
  categoryEquals?: number
  categoryNotEquals?: number
  categoryNotIn?: number[]
  slugEquals?: string
  slugNotEquals?: string
  tagsSlugIn?: string[]
}

interface ListOptions {
  collection: CollectionName
  page: number
  limit: number
  sort: [string, 'ASC' | 'DESC']
  filters: Filters
  includeBody: boolean
}

export interface LiteDoc {
  id: number
  title: string
  slug: string
  body?: unknown
  category: { id: number; name: string; slug: string } | null
  author: {
    id: number
    name: string
    slug: string
    email?: string | null
    shortBio?: string | null
    profilePhoto?: { id: number; url: string | null; alt: string; width: number | null; height: number | null } | null
    socialLinks?: {
      twitter?: string | null
      instagram?: string | null
      linkedin?: string | null
      facebook?: string | null
      youtube?: string | null
    }
  } | null
  tags?: { id: number; name: string; slug: string }[]
  featuredImage: { id: number; url: string | null; alt: string; width: number | null; height: number | null } | null
  publishedAt: string | null
  updatedAt: string
  createdAt: string
  status: string
  seo: { metaTitle: string | null; metaDescription: string | null; canonicalUrl: string | null }
}

export interface LiteListResponse {
  docs: LiteDoc[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ')
}

function toInt(value: string | null): number | undefined {
  if (value === null || value === '') return undefined
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : undefined
}

export function parseListParams(searchParams: URLSearchParams): ListOptions {
  const page = toInt(searchParams.get('page')) ?? 1
  const requestedLimit = toInt(searchParams.get('limit')) ?? 10
  const limit = Math.min(Math.max(requestedLimit, 1), 1000)

  const sortKey = searchParams.get('sort')
  const sort = (sortKey && SORT_OPTIONS[sortKey]) || SORT_OPTIONS['-publishedAt']

  const filters: Filters = {
    categoryEquals: toInt(searchParams.get('where[category][equals]')),
    categoryNotEquals: toInt(searchParams.get('where[category][not_equals]')),
    categoryNotIn: searchParams
      .getAll('where[category][not_in][]')
      .map(toInt)
      .filter((v): v is number => v !== undefined),
    slugEquals: searchParams.get('where[slug][equals]') || undefined,
    slugNotEquals: searchParams.get('where[slug][not_equals]') || undefined,
    tagsSlugIn: searchParams.getAll('where[tags.slug][in][]').filter(Boolean),
  }

  return { collection: 'news', page, limit, sort, filters, includeBody: Boolean(filters.slugEquals) }
}

export function buildWhere(collection: CollectionName, filters: Filters): { sql: string[]; binds: Array<string | number> } {
  const sql: string[] = [`${collection}.status = ?`]
  const binds: Array<string | number> = ['published']

  if (filters.categoryEquals !== undefined) {
    sql.push(`${collection}.category_id = ?`)
    binds.push(filters.categoryEquals)
  }
  if (filters.categoryNotEquals !== undefined) {
    sql.push(`${collection}.category_id != ?`)
    binds.push(filters.categoryNotEquals)
  }
  if (filters.categoryNotIn && filters.categoryNotIn.length > 0) {
    sql.push(`${collection}.category_id NOT IN (${placeholders(filters.categoryNotIn.length)})`)
    binds.push(...filters.categoryNotIn)
  }
  if (filters.slugEquals) {
    sql.push(`${collection}.slug = ?`)
    binds.push(filters.slugEquals)
  }
  if (filters.slugNotEquals) {
    sql.push(`${collection}.slug != ?`)
    binds.push(filters.slugNotEquals)
  }
  if (filters.tagsSlugIn && filters.tagsSlugIn.length > 0) {
    sql.push(
      `EXISTS (SELECT 1 FROM ${collection}_rels r JOIN tags t ON r.tags_id = t.id ` +
        `WHERE r.parent_id = ${collection}.id AND r.path = 'tags' AND t.slug IN (${placeholders(filters.tagsSlugIn.length)}))`,
    )
    binds.push(...filters.tagsSlugIn)
  }

  return { sql, binds }
}

interface Row {
  id: number
  title: string
  slug: string
  category_id: number | null
  author_id: number | null
  featured_image_id: number | null
  published_at: string | null
  updated_at: string
  created_at: string
  status: string
  seo_meta_title: string | null
  seo_meta_description: string | null
  seo_canonical_url: string | null
  body?: string | null
}

interface CategoryRow { id: number; name: string; slug: string }
interface AuthorRow {
  id: number
  name: string
  slug: string
  email?: string | null
  short_bio?: string | null
  profile_photo_id?: number | null
  social_links_twitter?: string | null
  social_links_instagram?: string | null
  social_links_linkedin?: string | null
  social_links_facebook?: string | null
  social_links_youtube?: string | null
}
interface MediaRow { id: number; alt: string; url: string | null; width: number | null; height: number | null }
interface TagRow { id: number; name: string; slug: string; parent_id: number }
interface TagRef { id: number; name: string; slug: string }

export function toDoc(row: Row, ctx: { categories: Map<number, CategoryRow>; authors: Map<number, AuthorRow>; media: Map<number, MediaRow>; tagsByParent: Map<number, TagRef[]> }): LiteDoc {
  const category = row.category_id != null ? ctx.categories.get(row.category_id) ?? null : null
  const author = row.author_id != null ? ctx.authors.get(row.author_id) ?? null : null
  const featuredImage = row.featured_image_id != null ? ctx.media.get(row.featured_image_id) ?? null : null

  const doc: LiteDoc = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: category ? { id: category.id, name: category.name, slug: category.slug } : null,
    author: author
      ? {
          id: author.id,
          name: author.name,
          slug: author.slug,
          email: author.email ?? null,
          shortBio: author.short_bio ?? null,
          profilePhoto: author.profile_photo_id != null ? (ctx.media.get(author.profile_photo_id) ?? null) : null,
          socialLinks: {
            twitter: author.social_links_twitter ?? null,
            instagram: author.social_links_instagram ?? null,
            linkedin: author.social_links_linkedin ?? null,
            facebook: author.social_links_facebook ?? null,
            youtube: author.social_links_youtube ?? null,
          },
        }
      : null,
    tags: ctx.tagsByParent.get(row.id) ?? [],
    featuredImage: featuredImage ? { id: featuredImage.id, url: featuredImage.url, alt: featuredImage.alt, width: featuredImage.width, height: featuredImage.height } : null,
    publishedAt: row.published_at ?? null,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    status: row.status,
    seo: {
      metaTitle: row.seo_meta_title ?? null,
      metaDescription: row.seo_meta_description ?? null,
      canonicalUrl: row.seo_canonical_url ?? null,
    },
  }

  if (row.body != null) {
    try {
      doc.body = JSON.parse(row.body)
    } catch {
      doc.body = row.body
    }
  }

  return doc
}

function toLiteListResponse(docs: LiteDoc[], totalDocs: number, limit: number, page: number): LiteListResponse {
  const totalPages = totalDocs === 0 ? 0 : Math.ceil(totalDocs / limit)
  return {
    docs,
    totalDocs,
    limit,
    totalPages,
    page,
    pagingCounter: (page - 1) * limit + 1,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
  }
}

async function getDb(): Promise<any> {
  const { env } = await getCloudflareContext({ async: true })
  return env.D1.withSession()
}

export async function fetchLiteList(options: ListOptions): Promise<LiteListResponse> {
  const { collection, page, limit, sort, filters, includeBody } = options
  const db = await getDb()

  const { sql, binds } = buildWhere(collection, filters)
  const whereSql = sql.join(' AND ')
  const [sortCol, sortDir] = sort

  const columns = includeBody ? `${LIST_COLUMNS}, body` : LIST_COLUMNS
  const listSql =
    `SELECT ${columns} FROM ${collection} WHERE ${whereSql} ` +
    `ORDER BY ${sortCol} ${sortDir} NULLS LAST, id ${sortDir} LIMIT ? OFFSET ?`
  const countSql = `SELECT COUNT(*) AS total FROM ${collection} WHERE ${whereSql}`

  const [listResult, countResult] = await db.batch([
    db.prepare(listSql).bind(...binds, limit, (page - 1) * limit),
    db.prepare(countSql).bind(...binds),
  ])

  const rows: Row[] = (listResult?.results ?? []) as Row[]
  const totalDocs: number = (countResult?.results?.[0]?.total as number) ?? 0

  const related = await fetchRelated(collection, rows)
  const docs = rows.map((row) => toDoc(row, related))

  return toLiteListResponse(docs, totalDocs, limit, page)
}

async function fetchRelated(
  collection: CollectionName,
  rows: Row[],
): Promise<{ categories: Map<number, CategoryRow>; authors: Map<number, AuthorRow>; media: Map<number, MediaRow>; tagsByParent: Map<number, TagRef[]> }> {
  const db = await getDb()

  const categoryIds = Array.from(new Set(rows.map((r) => r.category_id).filter((v): v is number => v != null)))
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id).filter((v): v is number => v != null)))
  const featuredMediaIds = Array.from(
    new Set(rows.map((r) => r.featured_image_id).filter((v): v is number => v != null)),
  )
  const parentIds = rows.map((r) => r.id)
  const allRowIds = parentIds.length ? placeholders(parentIds.length) : ''

  const statements: any[] = []
  if (categoryIds.length) statements.push(db.prepare(`SELECT id, name, slug FROM categories WHERE id IN (${placeholders(categoryIds.length)})`).bind(...categoryIds))
  if (authorIds.length) {
    statements.push(
      db
        .prepare(
          `SELECT id, name, slug, email, short_bio, profile_photo_id, ` +
            `social_links_twitter, social_links_instagram, social_links_linkedin, ` +
            `social_links_facebook, social_links_youtube FROM authors WHERE id IN (${placeholders(authorIds.length)})`,
        )
        .bind(...authorIds),
    )
  }
  if (parentIds.length) {
    statements.push(
      db
        .prepare(
          `SELECT r.parent_id AS parent_id, t.id, t.name, t.slug FROM ${collection}_rels r ` +
            `JOIN tags t ON r.tags_id = t.id WHERE r.path = 'tags' AND r.parent_id IN (${allRowIds})`,
        )
        .bind(...parentIds),
    )
  }

  const results = statements.length ? await db.batch(statements) : []

  const categories = new Map<number, CategoryRow>()
  const authors = new Map<number, AuthorRow>()
  const tagsByParent = new Map<number, TagRef[]>()
  const profilePhotoIds: number[] = []

  let idx = 0
  if (categoryIds.length) {
    for (const r of (results[idx]?.results ?? []) as CategoryRow[]) categories.set(r.id, r)
    idx++
  }
  if (authorIds.length) {
    const authorRows = (results[idx]?.results ?? []) as AuthorRow[]
    for (const r of authorRows) authors.set(r.id, r)
    for (const r of authorRows) if (r.profile_photo_id != null) profilePhotoIds.push(r.profile_photo_id)
    idx++
  }
  if (parentIds.length) {
    for (const r of (results[idx]?.results ?? []) as TagRow[]) {
      const list = tagsByParent.get(r.parent_id) ?? []
      list.push({ id: r.id, name: r.name, slug: r.slug })
      tagsByParent.set(r.parent_id, list)
    }
  }

  const mediaIds = Array.from(new Set([...featuredMediaIds, ...profilePhotoIds]))
  let media = new Map<number, MediaRow>()
  if (mediaIds.length) {
    const mediaResult = await db
      .prepare(`SELECT id, alt, url, width, height FROM media WHERE id IN (${placeholders(mediaIds.length)})`)
      .bind(...mediaIds)
      .all()
    media = new Map((mediaResult.results as MediaRow[]).map((r) => [r.id, r]))
  }

  return { categories, authors, media, tagsByParent }
}

export function liteJson(data: unknown): Response {
  return Response.json(data, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, s-maxage=60',
    },
  })
}

export async function liteListHandler(request: Request, collection: CollectionName): Promise<Response> {
  const url = new URL(request.url)
  const options = parseListParams(url.searchParams)
  options.collection = collection
  const data = await fetchLiteList(options)
  return liteJson(data)
}

export async function liteDetailHandler(request: Request, collection: CollectionName, slug: string): Promise<Response> {
  const options = parseListParams(new URLSearchParams())
  options.collection = collection
  options.filters = { ...options.filters, slugEquals: decodeURIComponent(slug) }
  options.page = 1
  options.limit = 1
  options.includeBody = true
  const data = await fetchLiteList(options)
  return liteJson(data)
}