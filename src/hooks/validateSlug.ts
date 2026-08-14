import type { Validate } from 'payload'

export const validateSlugUniqueness: Validate<string, any, any> = async (
  val,
  { req, operation, id, collectionSlug },
) => {
  if (!val) return true

  const { docs } = await req.payload.find({
    collection: collectionSlug as 'news' | 'blog' | 'authors' | 'categories' | 'tags',
    where: {
      slug: {
        equals: val,
      },
      ...(operation === 'update' ? { id: { not_equals: id } } : {}),
    },
    limit: 1,
  })

  if (docs.length > 0) {
    return 'Bu slug zaten kullanılıyor'
  }

  return true
}