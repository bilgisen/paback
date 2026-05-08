import type { CollectionBeforeChangeHook } from 'payload'

export const setPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (data?.status !== 'published') return data
  if (data?.publishedAt || originalDoc?.publishedAt) return data
  return {
    ...data,
    publishedAt: new Date().toISOString(),
  }
}
