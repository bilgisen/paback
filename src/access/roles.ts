import type { Access } from 'payload'

export type UserRole = 'admin' | 'editor' | 'author'

export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

export const isAdminOrEditor: Access = ({ req }) =>
  ['admin', 'editor'].includes(req.user?.role ?? '')

export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

export const adminOnly: Access = ({ req }) => req.user?.role === 'admin'

export const publicReadPublished: Access = ({ req }) => {
  if (req.user?.role === 'admin' || req.user?.role === 'editor') return true
  return {
    status: { equals: 'published' },
  }
}
