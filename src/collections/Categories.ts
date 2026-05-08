import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, adminOnly } from '../access/roles'
import { preventCategoryDelete } from '../hooks/preventDeleteIfHasContent'

export const Categories: CollectionConfig = {
  slug: 'categories',
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
  hooks: {
    beforeDelete: [preventCategoryDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Kategori Adı',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: { description: 'URL-safe benzersiz tanımlayıcı (örn. ekonomi, finans)' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Açıklama',
    },
  ],
}
