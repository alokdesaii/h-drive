// Backend team: replace these mock bodies with real fetch calls. Screens only import from here.
import type { AccessGrant, Activity, Folder, Item, Version } from './types'
import { activity, audit, grants, items, users } from './mock'

const delay = <T,>(v: T) => new Promise<T>(r => setTimeout(() => r(v), 150))

// GET /folders/:id/items?archived=false
export const listItems = (folderId: string | null) =>
  delay(items.filter(i => (i.kind === 'folder' ? i.parentId : i.folderId) === folderId && !i.archived))

// GET /folders/:id/path — root first
export function folderPath(folderId: string | null): Folder[] {
  const path: Folder[] = []
  let f = items.find(i => i.id === folderId) as Folder | undefined
  while (f) { path.unshift(f); f = items.find(i => i.id === f!.parentId) as Folder | undefined }
  return path
}

export const getItem = (id: string) => items.find(i => i.id === id)

// GET /documents/:id/versions
export const listVersions = (id: string): Promise<Version[]> => {
  const d = getItem(id)
  if (d?.kind !== 'document') return delay([])
  return delay(Array.from({ length: d.version }, (_, i) => ({
    number: d.version - i,
    size: d.size - i * 2048,
    uploadedAt: new Date(Date.parse(d.modifiedAt) - i * 86400000 * 3).toISOString(),
    uploadedBy: users[i % users.length],
    note: i === d.version - 1 ? 'Initial upload' : undefined,
  })))
}

// GET /items/:id/access
export const listAccess = (_id: string): Promise<AccessGrant[]> => delay(grants)

// GET /items/:id/activity
export const listActivity = (id: string): Promise<Activity[]> =>
  delay(activity.filter(a => a.entityName === getItem(id)?.name).concat(activity.slice(0, 3)).slice(0, 6))

// GET /folders — every folder the admin can manage (flat; build the tree client-side)
export const listFolders = () => items.filter((i): i is Folder => i.kind === 'folder')

export interface AuditQuery { action?: string; entity?: string; userId?: string; q?: string; page: number; pageSize: number }
// GET /audit?action=&entity=&userId=&q=&page=&pageSize=
export const listAudit = ({ action, entity, userId, q, page, pageSize }: AuditQuery) => {
  const rows = audit.filter(a =>
    (!action || a.action === action) && (!entity || a.entity === entity) && (!userId || a.user.id === userId)
    && (!q || `${a.entityName} ${a.details ?? ''}`.toLowerCase().includes(q.toLowerCase())))
  return delay({ total: rows.length, rows: rows.slice(page * pageSize, (page + 1) * pageSize) })
}
export const AUDIT_ACTIONS = [...new Set(audit.map(a => a.action))].sort()
export { users }

export type { Item }
