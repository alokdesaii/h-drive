// API contract for the backend team — see docs/model.md for meaning of each object.

export type Role = 'viewer' | 'contributor' | 'editor' | 'owner'
export type DocStatus = 'draft' | 'in_review' | 'approved'

export interface User {
  id: string
  name: string
  email: string
  isAdmin: boolean
}

export interface Folder {
  kind: 'folder'
  id: string
  name: string
  parentId: string | null
  itemCount: number
  modifiedAt: string // ISO
  modifiedBy: User
  archived: boolean
}

export interface Document {
  kind: 'document'
  id: string
  name: string
  folderId: string | null
  type: string // DocumentType name
  status: DocStatus
  size: number // bytes
  version: number
  createdAt: string
  createdBy: User
  modifiedAt: string
  modifiedBy: User
  archived: boolean
}

export type Item = Folder | Document

export interface Version {
  number: number
  size: number
  uploadedAt: string
  uploadedBy: User
  note?: string
}

export interface AccessGrant {
  user: User
  role: Role
  inheritedFrom?: { id: string; name: string } // absent = set directly on this item
}

export interface Activity {
  id: string
  at: string
  user: User
  action: string // e.g. DocumentUploaded
  entity: 'document' | 'folder' | 'user'
  entityName: string
  details?: string
}
