// Backend team: replace these mock bodies with real fetch calls. Screens only import from here.
import type { AccessGrant, Activity, Folder, Item, SearchQuery, SearchResult, Version } from './types'
import { activity, alertPrefs, archived, audit, notifications, subscriptions, documentTypes, excerpts, grants, items, members, settings, trash, users } from './mock'

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

export const DOMAIN = 'harbourandhills.com'
// GET /admin/users — everyone in the workspace (incl. pending invites and deactivated)
export const listMembers = () => delay(members.map(x => ({ ...x })))
// POST /admin/users/invite { emails[], isAdmin, message? }
// PATCH /admin/users/:id { isAdmin? , status?: 'active' | 'deactivated' }
// POST /admin/users/:id/resend-invite · DELETE /admin/users/:id (pending invites only)

// GET /admin/settings · PATCH /admin/settings (any subset of WorkspaceSettings)
export const getSettings = () => delay(structuredClone(settings))
// GET /document-types · POST /document-types · PATCH /document-types/:id
// DELETE /document-types/:id?reassignTo=<id> (documents move to another type first)
export const listDocumentTypes = () => delay(documentTypes.map(t => ({ ...t })))
export const DOC_TYPE_NAMES = documentTypes.map(t => t.name)

export const TYPE_COLORS = Object.fromEntries(documentTypes.map(t => [t.name, t.color]))

// GET /search?q=&type=&status=&folder=&within=&sort=  (mock: name + content match, newest data first)
export function search({ q, type, status, folderId, withinDays, sort }: SearchQuery): Promise<SearchResult[]> {
  const term = q.trim().toLowerCase()
  const now = Date.parse('2026-10-13T12:00:00Z')
  const inFolder = (i: Item) => {   // folderId matches the item's folder or any ancestor
    let f = i.kind === 'folder' ? i.parentId : i.folderId
    while (f) { if (f === folderId) return true; f = (items.find(x => x.id === f) as Folder | undefined)?.parentId ?? null }
    return false
  }
  const rows = items.filter(i => !i.archived).flatMap(i => {
    const nameHit = i.name.toLowerCase().includes(term)
    const text = excerpts[i.id] ?? ''
    const textHit = !!term && text.toLowerCase().includes(term)
    if (term && !nameHit && !textHit) return []
    if (type && (i.kind !== 'document' || i.type !== type)) return []
    if (status && (i.kind !== 'document' || i.status !== status)) return []
    if (folderId && !inFolder(i)) return []
    if (withinDays && now - Date.parse(i.modifiedAt) > withinDays * 86400000) return []
    const score = (nameHit ? 2 : 0) + (textHit ? 1 : 0) + (i.kind === 'folder' ? 0.5 : 0)
    return [{ score, r: { item: i, path: folderPath(i.kind === 'folder' ? i.parentId : i.folderId).map(f => f.name), excerpt: textHit ? text : undefined } }]
  })
  rows.sort((a, b) =>
    sort === 'name' ? a.r.item.name.localeCompare(b.r.item.name)
    : sort === 'modified' ? b.r.item.modifiedAt.localeCompare(a.r.item.modifiedAt)
    : b.score - a.score || b.r.item.modifiedAt.localeCompare(a.r.item.modifiedAt))
  return delay(rows.map(x => x.r))
}

// GET /archived · GET /trash  (newest first)
export const listArchived = () => delay(archived.map(x => ({ ...x })))
export const listTrash = () => delay(trash.map(x => ({ ...x })))
// POST /items/:id/restore → back to originalPath (recreated if it was removed)
// POST /items/:id/trash (from Archived) · DELETE /items/:id (Delete forever, admin only)
// DELETE /trash (Empty trash, admin only)

// GET /me/notifications · POST /me/notifications/read { ids[] | all: true } · POST /me/notifications/:id/unread
export const listNotifications = () => delay(notifications.map(x => ({ ...x })))
export const UNREAD_COUNT = notifications.filter(x => !x.read).length
// GET /me/subscriptions · POST /me/subscriptions { targetId, events, email }
// PATCH /me/subscriptions/:id { events?, email? } · DELETE /me/subscriptions/:id
export const listSubscriptions = () => delay(structuredClone(subscriptions))
// GET /me/alert-prefs · PATCH /me/alert-prefs { emailMode }
export const getAlertPrefs = () => delay({ ...alertPrefs })
