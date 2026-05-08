import type { CollectionBeforeDeleteHook } from 'payload'

interface PreventDeleteOptions {
  collections: Array<'news' | 'blog'>
  fieldName: string
}

export const createPreventDeleteIfHasContent = (
  options: PreventDeleteOptions,
): CollectionBeforeDeleteHook => {
  return async ({ id, req }) => {
    const { payload } = req
    let totalCount = 0

    for (const collection of options.collections) {
      const result = await payload.find({
        collection,
        where: { [options.fieldName]: { equals: id } },
        limit: 0,
        depth: 0,
      })
      totalCount += result.totalDocs
    }

    if (totalCount > 0) {
      throw new Error(
        `Bu kayıt silinemez: ${totalCount} adet içerik bu kayda bağlı. ` +
          `Silmeden önce bağlı içerikleri güncelleyin veya silin.`,
      )
    }
  }
}

export const preventAuthorDelete = createPreventDeleteIfHasContent({
  collections: ['news', 'blog'],
  fieldName: 'author',
})

export const preventCategoryDelete = createPreventDeleteIfHasContent({
  collections: ['news', 'blog'],
  fieldName: 'category',
})
