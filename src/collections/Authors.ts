import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, adminOnly } from '../access/roles'
import { preventAuthorDelete } from '../hooks/preventDeleteIfHasContent'
import { generateSlug } from '../hooks/generateSlug'

import { validateSlugUniqueness } from '../hooks/validateSlug'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'displayOrder', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: adminOnly,
  },
  hooks: {
    beforeValidate: [generateSlug],
    beforeDelete: [preventAuthorDelete],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Ad Soyad',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      validate: validateSlugUniqueness,
      admin: {
        description: 'URL-safe benzersiz tanımlayıcı (örn. evren-bolgun)',
      },
    },
    {
      name: 'email',
      type: 'email',
      label: 'E-posta',
    },
    {
      name: 'website',
      type: 'text',
      label: 'Web Sitesi',
      admin: { description: 'https:// ile başlayan URL' },
    },
    {
      name: 'shortBio',
      type: 'textarea',
      label: 'Kısa Biyografi',
      admin: { description: 'Yazar listesinde gösterilecek kısa tanıtım (1-2 cümle)' },
    },
    {
      name: 'longBio',
      type: 'richText',
      label: 'Uzun Biyografi',
      admin: { description: 'Yazar profil sayfasında gösterilecek detaylı biyografi' },
    },
    {
      name: 'profilePhoto',
      type: 'upload',
      relationTo: 'media',
      label: 'Profil Fotoğrafı',
    },
    {
      name: 'socialLinks',
      type: 'group',
      label: 'Sosyal Medya',
      fields: [
        { name: 'twitter', type: 'text', label: 'Twitter/X', admin: { description: '@kullaniciadi veya tam URL' } },
        { name: 'instagram', type: 'text', label: 'Instagram', admin: { description: '@kullaniciadi veya tam URL' } },
        { name: 'linkedin', type: 'text', label: 'LinkedIn', admin: { description: "Profil URL'si" } },
        { name: 'facebook', type: 'text', label: 'Facebook', admin: { description: 'Profil veya sayfa URL\'si' } },
        { name: 'youtube', type: 'text', label: 'YouTube', admin: { description: 'Kanal URL\'si' } },
      ],
    },
    {
      name: 'displayOrder',
      type: 'number',
      index: true,
      label: 'Gösterim Sırası',
      admin: { description: "Frontend'de yazar listesi sıralaması için (küçük sayı önce gelir)" },
    },
  ],
}
