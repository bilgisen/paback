import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, adminOnly } from '../access/roles'

import { validateSlugUniqueness } from '../hooks/validateSlug'

export const Tags: CollectionConfig = {
  slug: 'tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Etiket Adı',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      validate: validateSlugUniqueness,
    },
  ],
}
