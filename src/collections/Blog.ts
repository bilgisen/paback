import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, adminOnly, publicReadPublished } from '../access/roles'
import { generateSlug } from '../hooks/generateSlug'
import { setPublishedAt } from '../hooks/setPublishedAt'

export const Blog: CollectionConfig = {
  slug: 'blog',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'publishedAt', 'author', 'updatedAt'],
  },
  access: {
    read: publicReadPublished,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: adminOnly,
  },
  hooks: {
    beforeValidate: [generateSlug],
    beforeChange: [setPublishedAt],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Başlık',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: { description: 'Boş bırakılırsa başlıktan otomatik üretilir' },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      label: 'İçerik',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: false,
      label: 'Kategori',
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Etiketler',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
      label: 'Yazar',
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Yayın Tarihi',
      admin: {
        description: 'Boş bırakılırsa yayınlanma anında otomatik atanır',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Öne Çıkan Görsel',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      label: 'Durum',
      options: [
        { label: 'Taslak', value: 'draft' },
        { label: 'Yayında', value: 'published' },
      ],
    },
    {
      name: 'legacyUrl',
      type: 'text',
      index: true,
      label: 'Eski URL (WordPress)',
      admin: { hidden: true },
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Meta Başlık' },
        {
          name: 'metaDescription',
          type: 'text',
          maxLength: 160,
          label: 'Meta Açıklama',
          admin: { description: 'Maksimum 160 karakter' },
        },
        {
          name: 'canonicalUrl',
          type: 'text',
          label: 'Canonical URL',
          admin: { description: 'Otomatik: /kose-yazisi/{slug}' },
        },
      ],
    },
  ],
}
