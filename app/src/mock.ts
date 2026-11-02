import type { AccessGrant, Activity, AlertEvent, AlertPrefs, Document, DocumentType, Folder, Item, Member, Notification, RemovedItem, Subscription, User, WorkspaceSettings } from './types'

export const users: User[] = [
  { id: 'u1', name: 'Alok Desai', email: 'alok.desai@harbourandhills.com', isAdmin: true },
  { id: 'u2', name: 'Priya Shah', email: 'priya.shah@harbourandhills.com', isAdmin: false },
  { id: 'u3', name: 'Daniel Okafor', email: 'daniel.okafor@harbourandhills.com', isAdmin: false },
  { id: 'u4', name: 'Mei Lin', email: 'mei.lin@harbourandhills.com', isAdmin: false },
  { id: 'u5', name: 'Rohan Mehta', email: 'rohan.mehta@harbourandhills.com', isAdmin: false },
]
const [alok, priya, daniel, mei, rohan] = users

const d = (daysAgo: number, h = 10) => new Date(Date.UTC(2026, 9, 13 - daysAgo, h, 24)).toISOString()

const folder = (id: string, name: string, parentId: string | null, itemCount: number, by: User, days: number): Folder =>
  ({ kind: 'folder', id, name, parentId, itemCount, modifiedAt: d(days), modifiedBy: by, archived: false })

const doc = (id: string, name: string, folderId: string | null, type: string, status: Document['status'], kb: number, version: number, by: User, days: number): Document =>
  ({ kind: 'document', id, name, folderId, type, status, size: kb * 1024, version, createdAt: d(days + 20), createdBy: by, modifiedAt: d(days, 9 + version), modifiedBy: by, archived: false })

export const items: Item[] = [
  folder('f1', 'Finance', null, 6, priya, 1),
  folder('f2', 'Legal & Contracts', null, 4, daniel, 2),
  folder('f3', 'Technology and Data', null, 3, rohan, 5),
  folder('f4', 'HR & People', null, 2, mei, 9),
  folder('f5', 'Board Papers', null, 0, alok, 30),
  doc('d1', 'Group Strategy 2027.pdf', null, 'Report', 'approved', 2380, 4, alok, 0),
  doc('d2', 'TechFuse Collection.txt', null, 'Contract', 'draft', 82, 1, rohan, 3),
  doc('d3', 'Brand Guidelines.pdf', null, 'Policy', 'approved', 14200, 2, mei, 12),

  folder('f11', 'FY2026 Audit', 'f1', 3, priya, 1),
  doc('d11', 'Q3 Management Accounts.xlsx', 'f1', 'Report', 'in_review', 512, 3, priya, 1),
  doc('d12', 'Budget FY27 – Draft.xlsx', 'f1', 'General', 'draft', 288, 7, daniel, 2),
  doc('d13', 'Treasury Policy.docx', 'f1', 'Policy', 'approved', 96, 2, alok, 40),
  doc('d14', 'Vendor Payments Sept.csv', 'f1', 'General', 'approved', 41, 1, mei, 8),
  doc('d15', 'Cash Flow Forecast.xlsx', 'f1', 'Report', 'draft', 176, 5, priya, 4),
  doc('d111', 'Auditor Engagement Letter.pdf', 'f11', 'Contract', 'approved', 640, 1, priya, 15),
  doc('d112', 'Trial Balance.xlsx', 'f11', 'Report', 'in_review', 220, 2, daniel, 1),

  doc('d21', 'Master Services Agreement – Acme.pdf', 'f2', 'Contract', 'approved', 1240, 3, daniel, 2),
  doc('d22', 'NDA Template.docx', 'f2', 'Contract', 'approved', 58, 6, daniel, 60),
  doc('d23', 'Lease Renewal – HK Office.pdf', 'f2', 'Contract', 'in_review', 3100, 2, alok, 6),
  doc('d24', 'Data Processing Addendum.docx', 'f2', 'Contract', 'draft', 74, 1, rohan, 3),

  doc('d31', 'Architecture Overview.pdf', 'f3', 'General', 'approved', 4800, 2, rohan, 5),
  doc('d32', 'Access Review Q3.xlsx', 'f3', 'Report', 'in_review', 130, 1, rohan, 7),
  doc('d33', 'Incident Runbook.md', 'f3', 'Policy', 'draft', 22, 9, rohan, 1),

  doc('d41', 'Employee Handbook.pdf', 'f4', 'Policy', 'approved', 2100, 5, mei, 9),
  doc('d42', 'Leave Policy 2027.docx', 'f4', 'Policy', 'draft', 64, 2, mei, 10),
]

export const grants: AccessGrant[] = [
  { user: alok, role: 'owner' },
  { user: priya, role: 'editor' },
  { user: daniel, role: 'contributor', inheritedFrom: { id: 'root', name: 'Documents' } },
  { user: mei, role: 'viewer', inheritedFrom: { id: 'root', name: 'Documents' } },
]

export const activity: Activity[] = [
  { id: 'a1', at: d(0, 9), user: alok, action: 'DocumentViewed', entity: 'document', entityName: 'Group Strategy 2027.pdf' },
  { id: 'a2', at: d(1, 14), user: priya, action: 'VersionUploaded', entity: 'document', entityName: 'Q3 Management Accounts.xlsx', details: 'Version 3' },
  { id: 'a3', at: d(1, 11), user: priya, action: 'StatusChanged', entity: 'document', entityName: 'Q3 Management Accounts.xlsx', details: 'Draft → In review' },
  { id: 'a4', at: d(2, 16), user: daniel, action: 'AccessGranted', entity: 'folder', entityName: 'Legal & Contracts', details: 'Mei Lin as Viewer' },
  { id: 'a5', at: d(3, 10), user: rohan, action: 'DocumentUploaded', entity: 'document', entityName: 'TechFuse Collection.txt' },
]

// ~60 audit events for the Audit log screen
const ACTIONS: [string, Activity['entity'], string?][] = [
  ['DocumentViewed', 'document'], ['DocumentDownloaded', 'document'], ['DocumentUploaded', 'document'],
  ['VersionUploaded', 'document'], ['StatusChanged', 'document', 'Draft → In review'], ['DocumentArchived', 'document'],
  ['DocumentTrashed', 'document'], ['FolderCreated', 'folder'], ['AccessGranted', 'folder', 'as Viewer'],
  ['AccessRevoked', 'folder'], ['UserInvited', 'user'], ['UserRoleChanged', 'user', 'Member → Admin'],
]
export const audit: Activity[] = Array.from({ length: 60 }, (_, i) => {
  const [action, entity, details] = ACTIONS[(i * 7) % ACTIONS.length]
  const docs = items.filter(x => x.kind === 'document'), folders = items.filter(x => x.kind === 'folder')
  const entityName = entity === 'user' ? users[(i + 2) % users.length].name
    : entity === 'folder' ? folders[i % folders.length].name : docs[(i * 3) % docs.length].name
  return { id: `au${i}`, at: d(Math.floor(i / 4), 17 - (i % 8)), user: users[(i * 3) % users.length], action, entity, entityName, details }
})

// Users screen: everyone in the workspace
const m = (u: User, department: string, status: Member['status'], lastDays: number | null, invitedDays: number, gb: number, invitedBy?: string): Member =>
  ({ ...u, department, status, lastActiveAt: lastDays === null ? null : d(lastDays, 9 + (invitedDays % 8)), invitedAt: d(invitedDays), invitedBy, storageUsed: gb * 1024 ** 3 })
const person = (id: string, name: string, isAdmin = false): User =>
  ({ id, name, email: `${name.toLowerCase().replace(' ', '.')}@harbourandhills.com`, isAdmin })
export const members: Member[] = [
  m(alok, 'Leadership', 'active', 0, 400, 38.2),
  m(priya, 'Finance', 'active', 0, 380, 64.5, 'Alok Desai'),
  m(daniel, 'Legal', 'active', 1, 360, 41.9, 'Alok Desai'),
  m(mei, 'People & Culture', 'active', 2, 300, 22.4, 'Alok Desai'),
  m(rohan, 'Technology', 'active', 0, 290, 57.1, 'Alok Desai'),
  m(person('u6', 'Sara Khan', true), 'Technology', 'active', 0, 280, 12.8, 'Alok Desai'),
  m(person('u7', 'James Wong'), 'Finance', 'active', 4, 210, 9.3, 'Priya Shah'),
  m(person('u8', 'Ananya Iyer'), 'Legal', 'active', 12, 200, 6.1, 'Daniel Okafor'),
  m(person('u9', 'Tom Fletcher'), 'Operations', 'active', 34, 190, 3.4, 'Alok Desai'),
  m(person('u10', 'Lucia Romero'), 'Marketing', 'active', 1, 150, 18.7, 'Alok Desai'),
  m(person('u11', 'Kenji Sato'), 'Operations', 'active', 41, 140, 1.2, 'Sara Khan'),
  m(person('u12', 'Hannah Becker'), 'Finance', 'invited', null, 3, 0, 'Priya Shah'),
  m(person('u13', 'Omar Haddad'), 'Technology', 'invited', null, 9, 0, 'Sara Khan'),
  m(person('u14', 'Grace Mensah'), 'People & Culture', 'deactivated', 96, 330, 4.5, 'Mei Lin'),
  m(person('u15', 'Victor Lam'), 'Legal', 'deactivated', 120, 310, 2.2, 'Daniel Okafor'),
]

export const documentTypes: DocumentType[] = [
  { id: 't1', name: 'Contract', color: '#023e63', description: 'Agreements, NDAs, leases and addenda', documentCount: 412 },
  { id: 't2', name: 'Policy', color: '#00bfb3', description: 'Internal policies and handbooks', documentCount: 168 },
  { id: 't3', name: 'Report', color: '#6366f1', description: 'Management accounts, reviews and board packs', documentCount: 2304 },
  { id: 't4', name: 'General', color: '#94a3b8', description: 'Anything that doesn’t fit another type', documentCount: 9596 },
]

export const settings: WorkspaceSettings = {
  workspaceName: 'Harbour & Hills', domain: 'harbourandhills.com', sessionTimeoutHours: 12,
  defaultShareRole: 'viewer', allowPublicLinks: false, requireReview: true,
  statusLabels: { draft: 'Draft', in_review: 'In review', approved: 'Approved' },
  trashRetentionDays: 30, versionsToKeep: null, autoArchiveDays: 365, storageQuotaGb: 1000, emailDigest: 'daily',
}

// Text pulled from inside files, so search can show where a term matched (backend: full-text index).
export const excerpts: Record<string, string> = {
  d1: 'Our 2027 priorities: grow recurring revenue, consolidate the Hong Kong and Singapore offices, and complete the move to a single document workspace.',
  d2: 'TechFuse collection terms: payment within 30 days of invoice, data retained for seven years, termination with 90 days written notice.',
  d3: 'The navy and teal palette is used sparingly. Logo clear space equals the height of the H crossbar. Inter is the brand typeface.',
  d11: 'Q3 revenue ahead of budget by 4.2%. Operating costs flat. Cash position strong after the lease renewal deposit.',
  d12: 'Draft budget for FY27 assumes 6% headcount growth and a 12% increase in technology spend, mainly cloud storage and security.',
  d13: 'Treasury policy: surplus cash is held across at least three banks. No single counterparty above 40% of total deposits.',
  d15: 'Cash flow forecast for the next 13 weeks, including the lease renewal deposit and quarterly tax payments.',
  d21: 'Master services agreement between Harbour & Hills and Acme Ltd. Term of three years with automatic renewal unless terminated.',
  d22: 'Mutual non-disclosure agreement template. Confidential information excludes anything already public or independently developed.',
  d23: 'Lease renewal for the Hong Kong office, Level 12. Five year term, rent review in year three, break clause after year two.',
  d24: 'Data processing addendum covering personal data, sub-processors, breach notification within 72 hours and data retention.',
  d31: 'Architecture overview: documents are stored encrypted at rest, access is checked on every request, and every action is written to the audit log.',
  d33: 'Incident runbook: who to call, how to revoke access quickly, and how to restore a file from version history.',
  d41: 'Employee handbook covering leave, expenses, security and the code of conduct. Read alongside the leave policy.',
  d42: 'Leave policy 2027: 22 days annual leave, rising to 25 after three years. Carry over up to five days into the next year.',
  d111: 'Engagement letter for the FY2026 audit. Fieldwork in January, final report due by the end of March.',
}

// Archived: put away, read-only, kept indefinitely
const removed = (item: Item, by: User, days: number, originalPath: string[], auto = false): RemovedItem =>
  ({ item: { ...item, archived: true }, removedBy: by, removedAt: d(days, 15), originalPath, auto })
export const archived: RemovedItem[] = [
  removed(folder('fa1', 'FY2024 Audit', 'f1', 14, priya, 210), priya, 40, ['Finance']),
  removed(folder('fa2', 'Old Branding 2022', null, 38, mei, 400), mei, 95, []),
  removed(doc('da1', 'Board Pack – Q4 2025.pdf', 'f5', 'Report', 'approved', 8400, 3, alok, 300), alok, 12, ['Board Papers']),
  removed(doc('da2', 'Office Lease 2021–2026.pdf', 'f2', 'Contract', 'approved', 5200, 2, daniel, 500), daniel, 6, ['Legal & Contracts']),
  removed(doc('da3', 'Expense Policy 2024.docx', 'f1', 'Policy', 'approved', 88, 4, priya, 420), priya, 60, ['Finance']),
  removed(doc('da4', 'Vendor Payments Q1 2025.csv', 'f1', 'General', 'approved', 52, 1, mei, 560), alok, 3, ['Finance'], true),
  removed(doc('da5', 'Network Diagram v2.pdf', 'f3', 'General', 'approved', 2900, 2, rohan, 470), alok, 3, ['Technology and Data'], true),
  removed(doc('da6', 'Recruitment Plan 2025.xlsx', 'f4', 'Report', 'approved', 310, 6, mei, 380), mei, 22, ['HR & People']),
]

// Trash: deleted, restorable until the retention period (Settings) runs out
export const trash: RemovedItem[] = [
  removed(doc('dt1', 'Budget FY27 – Draft v1.xlsx', 'f1', 'General', 'draft', 270, 1, daniel, 9), daniel, 1, ['Finance']),
  removed(doc('dt2', 'NDA – Acme (unsigned).docx', 'f2', 'Contract', 'draft', 61, 2, daniel, 30), daniel, 4, ['Legal & Contracts']),
  removed(folder('ft1', 'Scratch – Rohan', 'f3', 7, rohan, 40), rohan, 9, ['Technology and Data']),
  removed(doc('dt3', 'Team Offsite Photos.zip', null, 'General', 'draft', 184000, 1, mei, 60), mei, 17, []),
  removed(doc('dt4', 'Leave Policy 2026 (old).docx', 'f4', 'Policy', 'approved', 58, 3, mei, 200), mei, 24, ['HR & People']),
  removed(doc('dt5', 'Copy of Treasury Policy.docx', 'f1', 'Policy', 'draft', 96, 1, priya, 31), priya, 27, ['Finance']),
  removed(doc('dt6', 'Untitled spreadsheet.xlsx', 'f1', 'General', 'draft', 12, 1, priya, 29), priya, 29, ['Finance']),
]

// Alerts for the signed-in user (Alok)
const tgt = (id: string): Notification['target'] => {
  const i = items.find(x => x.id === id)!
  const parent = i.kind === 'folder' ? i.parentId : i.folderId
  const path: string[] = []; let f = items.find(x => x.id === parent) as Folder | undefined
  while (f) { path.unshift(f.name); f = items.find(x => x.id === f!.parentId) as Folder | undefined }
  return { id: i.id, name: i.name, kind: i.kind, folderId: parent, path }
}
const n = (id: string, hoursAgo: number, read: boolean, event: AlertEvent, actor: User, target: string, because: string, detail?: string): Notification =>
  ({ id, at: new Date(Date.parse('2026-10-13T12:00:00Z') - hoursAgo * 3600000).toISOString(), read, event, actor, target: tgt(target), because, detail })
export const notifications: Notification[] = [
  n('n1', 1, false, 'uploaded', priya, 'd11', 'Finance', 'Version 3'),
  n('n2', 3, false, 'status', daniel, 'd23', 'Legal & Contracts', 'Draft → In review'),
  n('n3', 5, false, 'shared', daniel, 'f2', 'Legal & Contracts', 'with Mei Lin as Viewer'),
  n('n4', 22, true, 'changed', rohan, 'd33', 'Incident Runbook.md', 'Version 9'),
  n('n5', 26, true, 'uploaded', priya, 'd112', 'Finance', 'New file'),
  n('n6', 30, true, 'status', alok, 'd1', 'Group Strategy 2027.pdf', 'In review → Approved'),
  n('n7', 52, true, 'deleted', daniel, 'd24', 'Legal & Contracts', 'Moved to trash'),
  n('n8', 75, true, 'changed', daniel, 'd12', 'Finance', 'Version 7'),
  n('n9', 98, true, 'shared', mei, 'f4', 'HR & People', 'with Rohan Mehta as Editor'),
  n('n10', 140, true, 'uploaded', mei, 'd42', 'HR & People', 'New file'),
  n('n11', 190, true, 'status', priya, 'd13', 'Finance', 'In review → Approved'),
]

const allOn: Record<AlertEvent, boolean> = { uploaded: true, changed: true, status: true, shared: true, deleted: true }
const sub = (id: string, target: string, events: Partial<Record<AlertEvent, boolean>>, email: boolean): Subscription => {
  const t = tgt(target); return { id, target: { id: t.id, name: t.name, kind: t.kind, path: t.path }, events: { ...allOn, ...events }, email }
}
export const subscriptions: Subscription[] = [
  sub('s1', 'f1', {}, true),
  sub('s2', 'f2', { changed: false }, true),
  sub('s3', 'f4', { changed: false, status: false }, false),
  sub('s4', 'd1', {}, true),
  sub('s5', 'd33', { shared: false, deleted: false }, false),
]
export const alertPrefs: AlertPrefs = { emailMode: 'daily' }
