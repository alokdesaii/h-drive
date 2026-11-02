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

export type MemberStatus = 'active' | 'invited' | 'deactivated'

/** A person in the H Drive workspace, as shown on the admin Users screen. */
export interface Member extends User {
  status: MemberStatus
  department: string
  lastActiveAt: string | null // null = never signed in
  invitedAt: string
  invitedBy?: string // name of the admin who invited them
  storageUsed: number // bytes they own
}

/** Admin-managed category for documents (Settings → Document types). */
export interface DocumentType {
  id: string
  name: string
  color: string // hex, used for the small type dot
  description: string
  documentCount: number
}

/** Workspace-wide settings (Settings screen). PATCH /admin/settings with any subset. */
export interface WorkspaceSettings {
  workspaceName: string
  domain: string // read-only: set by Google Workspace
  sessionTimeoutHours: number
  defaultShareRole: Role
  allowPublicLinks: boolean
  requireReview: boolean // documents need approval before "Approved"
  statusLabels: Record<DocStatus, string>
  trashRetentionDays: number
  versionsToKeep: number | null // null = keep all
  autoArchiveDays: number | null // null = never
  storageQuotaGb: number
  emailDigest: 'off' | 'daily' | 'weekly'
}

export type SearchSort = 'relevance' | 'modified' | 'name'

/** GET /search?q=&type=&status=&folder=&within=&sort= */
export interface SearchQuery {
  q: string
  type?: string
  status?: DocStatus
  folderId?: string
  withinDays?: number
  sort: SearchSort
}

export interface SearchResult {
  item: Item
  path: string[] // folder names, root first
  excerpt?: string // text around the match inside the file, when the match is in the content
}

/** An archived or trashed file/folder (Archived and Trash screens). */
export interface RemovedItem {
  item: Item
  removedAt: string
  removedBy: User
  originalPath: string[] // folder names it came from, root first; Restore puts it back here
  auto?: boolean // archived automatically by the auto-archive rule
}

export type AlertEvent = 'uploaded' | 'changed' | 'status' | 'shared' | 'deleted'

/** One update delivered to the signed-in user (Alerts feed). */
export interface Notification {
  id: string
  at: string
  read: boolean
  event: AlertEvent
  actor: User
  target: { id: string; name: string; kind: 'document' | 'folder'; folderId: string | null; path: string[] }
  detail?: string // e.g. "Version 4", "Draft → In review", "with Mei Lin as Viewer"
  because: string // name of the followed item that caused it
}

/** Something the user follows ("Alert me"). Folders include everything inside them. */
export interface Subscription {
  id: string
  target: { id: string; name: string; kind: 'document' | 'folder'; path: string[] }
  events: Record<AlertEvent, boolean>
  email: boolean
}

export interface AlertPrefs {
  emailMode: 'instant' | 'daily' | 'weekly' | 'off'
}
