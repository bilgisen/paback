import type { CollectionBeforeValidateHook } from 'payload'
import { toSlug } from '../utils/slug'

export const generateSlug: CollectionBeforeValidateHook = ({ data, operation, collection }) => {
  if (operation !== 'create' && operation !== 'update') return data
  if (data?.slug && data.slug.trim() !== '') return data

  if (collection.slug === 'authors' && data?.name) {
    return { ...data, slug: toSlug(data.name) }
  }

  if ((collection.slug === 'news' || collection.slug === 'blog') && data?.title) {
    return { ...data, slug: toSlug(data.title) }
  }

  return data
}
