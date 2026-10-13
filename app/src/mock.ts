import type { AccessGrant, Activity, Document, Folder, Item, User } from './types'

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
