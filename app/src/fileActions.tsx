/**
 * Every file/folder pop-up in one place: New folder, Upload (+ progress panel), Share, Move, Rename,
 * Move to trash, Archive, Alert me, Copy link. Documents and the details drawer both call `act.*`,
 * so an action behaves the same wherever it's started.
 *
 * Backend endpoints (mock bodies below just update the list on screen):
 *   POST   /folders { name, parentId }                     New folder
 *   POST   /uploads (multipart, per file) ?folder=&onConflict=version|keep-both
 *   PATCH  /items/:id { name } | { parentId }               Rename / Move
 *   POST   /items/:id/archive · POST /items/:id/trash
 *   POST   /items/:id/share { email, role } · GET /items/:id/link
 *   POST   /me/subscriptions { targetId }                   Alert me
 */
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle, Archive, Check, ChevronDown, ChevronRight, FileUp, FolderInput, FolderPlus, Globe, Link2, Lock, Minus, Trash2, X,
} from 'lucide-react'
import { folderPath, listFolders, users } from './api'
import type { Document, Folder, Item } from './types'
import { Button, Dialog, ItemIcon, fmtSize, useToast } from './ui'
import { Access } from './pages/DetailsDrawer'

const ME = users[0]
const now = () => new Date('2026-10-13T12:00:00Z').toISOString()
const MAX_BYTES = 2 * 1024 ** 3 // 2 GB per file
const nameOk = (n: string) => n.trim() && !/[\\/:*?"<>|]/.test(n)

export type FileActions = ReturnType<typeof useFileActions>['act']

export function useFileActions({ folderId, items, setItems }: {
  folderId: string | null; items: Item[] | null; setItems: Dispatch<SetStateAction<Item[] | null>>
}) {
  const [toast, showToast] = useToast()
  const [dialog, setDialog] = useState<
    | { kind: 'new-folder' } | { kind: 'rename'; item: Item } | { kind: 'move'; items: Item[] }
    | { kind: 'share'; item: Item | null } | { kind: 'trash' | 'archive'; items: Item[] } | null
  >(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [following, setFollowing] = useState<Set<string>>(new Set(['f1', 'f2', 'f4', 'd1', 'd33'])) // mirrors Manage alerts
  const fileInput = useRef<HTMLInputElement>(null)
  const folderInput = useRef<HTMLInputElement>(null)
  const versionFor = useRef<Item | null>(null)

  const here = items ?? []
  const remove = (ids: string[]) => setItems(xs => xs && xs.filter(x => !ids.includes(x.id)))
  const label = (xs: Item[]) => xs.length === 1 ? `“${xs[0].name}”` : `${xs.length} items`

  // ── upload: real file pickers / drop → simulated progress ──
  const startUpload = (files: File[], asVersionOf?: Item) => {
    const batch: Upload[] = files.map((f, i) => {
      const clash = !asVersionOf && here.find(x => x.kind === 'document' && x.name.toLowerCase() === f.name.toLowerCase())
      return {
        id: `${Date.now()}-${i}`, name: asVersionOf?.name ?? f.name, size: f.size, progress: 0,
        state: f.size > MAX_BYTES ? 'error' : clash ? 'conflict' : 'uploading',
        error: f.size > MAX_BYTES ? 'Larger than 2 GB' : undefined, versionOf: asVersionOf?.id ?? (clash ? clash.id : undefined),
      }
    })
    setUploads(us => [...us.filter(u => u.state !== 'done' || Date.now() - u.doneAt! < 4000), ...batch])
  }
  useEffect(() => {
    if (!uploads.some(u => u.state === 'uploading')) return
    const t = setInterval(() => setUploads(us => us.map(u => {
      if (u.state !== 'uploading') return u
      const progress = Math.min(100, u.progress + 6 + Math.random() * 18 * (8e6 / Math.max(u.size, 8e6)))
      return progress < 100 ? { ...u, progress } : { ...u, progress: 100, state: 'done', doneAt: Date.now() }
    })), 220)
    return () => clearInterval(t)
  }, [uploads])
  // once per finished file: add it to the list, or bump the version (kept out of state updaters so it can't run twice)
  useEffect(() => {
    const landed = uploads.filter(u => u.state === 'done' && !u.applied)
    if (!landed.length) return
    setItems(xs => {
      if (!xs) return xs
      let next = xs
      for (const u of landed) next = u.versionOf
        ? next.map(x => x.id === u.versionOf && x.kind === 'document' ? { ...x, version: x.version + 1, size: u.size, modifiedAt: now(), modifiedBy: ME } : x)
        : next.some(x => x.id === `d${u.id}`) ? next : [...next, newDoc(u, folderId)]
      return next
    })
    setUploads(us => us.map(u => landed.some(l => l.id === u.id) ? { ...u, applied: true } : u))
  }, [uploads, folderId, setItems])

  const act = {
    newFolder: () => setDialog({ kind: 'new-folder' }),
    uploadFiles: () => { versionFor.current = null; fileInput.current?.click() },
    uploadFolder: () => folderInput.current?.click(),
    uploadVersion: (item: Item) => { versionFor.current = item; fileInput.current?.click() },
    dropFiles: (files: File[]) => files.length && startUpload(files),
    share: (item: Item | null) => setDialog({ kind: 'share', item }),
    rename: (item: Item) => setDialog({ kind: 'rename', item }),
    move: (xs: Item[]) => setDialog({ kind: 'move', items: xs }),
    trash: (xs: Item[]) => setDialog({ kind: 'trash', items: xs }),
    archive: (xs: Item[]) => setDialog({ kind: 'archive', items: xs }),
    copyLink: (item: Item | null) => {
      const url = `${location.origin}/documents/${item ? (item.kind === 'folder' ? item.id : `${item.folderId ?? ''}?item=${item.id}`) : folderId ?? ''}`
      navigator.clipboard?.writeText(url).catch(() => {})
      showToast('Link copied. Only people with access can open it')
    },
    isFollowing: (item: Item) => following.has(item.id),
    toggleFollow: (item: Item) => setFollowing(s => {
      const n = new Set(s)
      if (n.has(item.id)) { n.delete(item.id); showToast(`Stopped alerts for ${item.name}`) } else { n.add(item.id); showToast(`You’ll get alerts for ${item.name}`) }
      return n
    }),
    download: (xs: Item[]) => showToast(xs.length === 1 && xs[0].kind === 'document' ? `Downloading ${xs[0].name}` : `Preparing ${label(xs)} as a .zip`),
  }

  const close = () => setDialog(null)
  const ui = <>
    <input ref={fileInput} type="file" multiple hidden onChange={e => {
      const fs = [...(e.target.files ?? [])]; e.target.value = ''
      if (versionFor.current && fs[0]) startUpload([fs[0]], versionFor.current); else startUpload(fs)
    }} />
    <input ref={folderInput} type="file" hidden multiple {...{ webkitdirectory: '' }} onChange={e => { const fs = [...(e.target.files ?? [])]; e.target.value = ''; startUpload(fs) }} />

    <NameDialog open={dialog?.kind === 'new-folder'} title="New folder" cta="Create folder" icon={FolderPlus}
      where={['Documents', ...folderPath(folderId).map(f => f.name)].join(' / ')} initial="Untitled folder" taken={here.map(x => x.name)}
      onClose={close} onSave={name => {
        setItems(xs => xs && [...xs, { kind: 'folder', id: `f${Date.now()}`, name, parentId: folderId, itemCount: 0, modifiedAt: now(), modifiedBy: ME, archived: false }])
        close(); showToast(`Folder “${name}” created`)
      }} />

    {dialog?.kind === 'rename' && (
      <NameDialog open title={`Rename ${dialog.item.kind}`} cta="Rename" icon={FolderInput} initial={dialog.item.name}
        keepExtension={dialog.item.kind === 'document'} taken={here.filter(x => x.id !== dialog.item.id).map(x => x.name)}
        onClose={close} onSave={name => { setItems(xs => xs && xs.map(x => x.id === dialog.item.id ? { ...x, name } : x)); close(); showToast(`Renamed to “${name}”`) }} />
    )}

    {dialog?.kind === 'move' && <MoveDialog items={dialog.items} from={folderId} onClose={close} onMove={(to, toName) => {
      if (to !== folderId) remove(dialog.items.map(x => x.id))
      close(); showToast(`${label(dialog.items)} moved to ${toName}`)
    }} />}

    {dialog?.kind === 'share' && <ShareDialog item={dialog.item} folderId={folderId} onClose={close} onCopy={() => act.copyLink(dialog.item)} />}

    {(dialog?.kind === 'trash' || dialog?.kind === 'archive') && (
      <ConfirmRemove kind={dialog.kind} items={dialog.items} onClose={close} onConfirm={() => {
        remove(dialog.items.map(x => x.id)); close()
        showToast(dialog.kind === 'trash' ? `${label(dialog.items)} moved to Trash` : `${label(dialog.items)} archived`)
      }} />
    )}

    <UploadPanel uploads={uploads} setUploads={setUploads} />
    {toast}
  </>
  return { act, ui }
}

/* ── New folder / Rename ── */

function NameDialog({ open, title, cta, icon: Icon, initial, where, taken, keepExtension, onClose, onSave }: {
  open: boolean; title: string; cta: string; icon: typeof FolderPlus; initial: string; where?: string; taken: string[]
  keepExtension?: boolean; onClose: () => void; onSave: (name: string) => void
}) {
  const ext = keepExtension && initial.includes('.') ? initial.slice(initial.lastIndexOf('.')) : ''
  const [name, setName] = useState(initial)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!open) return
    setName(initial)
    // select the name but not the extension, like Finder/Drive
    // after <dialog> has applied its own focus, otherwise it resets the selection
    const t = setTimeout(() => { input.current?.focus(); input.current?.setSelectionRange(0, initial.length - ext.length) }, 30)
    return () => clearTimeout(t)
  }, [open, initial, ext.length])
  const v = name.trim()
  const clash = taken.some(t => t.toLowerCase() === v.toLowerCase())
  const extChanged = !!ext && !v.toLowerCase().endsWith(ext.toLowerCase())
  const err = !v ? 'Enter a name' : !nameOk(v) ? 'Names can’t contain \\ / : * ? " < > |' : clash ? 'Something here already has this name' : null
  return (
    <Dialog open={open} onClose={onClose} title={title} description={where ? `In ${where}` : undefined} width={440}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!!err || v === initial} onClick={() => onSave(v)}><Icon size={15} /> {cta}</Button></>}>
      <form onSubmit={e => { e.preventDefault(); if (!err && v !== initial) onSave(v) }}>
        <input ref={input} value={name} onChange={e => setName(e.target.value)} aria-label="Name" aria-invalid={!!err && name !== initial}
          className={`h-10 w-full rounded-md border bg-surface px-3 text-[14px] outline-none ${err && name !== initial ? 'border-red-500' : 'border-line focus:border-teal'}`} />
      </form>
      <p className={`mt-1.5 text-[12px] ${err && name !== initial ? 'text-red-600' : extChanged ? 'text-amber-600' : 'text-muted'}`}>
        {err && name !== initial ? err : extChanged ? `Changing “${ext}” may stop the file opening correctly.` : ' '}
      </p>
    </Dialog>
  )
}

/* ── Move: folder tree picker ── */

function MoveDialog({ items, from, onClose, onMove }: { items: Item[]; from: string | null; onClose: () => void; onMove: (to: string | null, name: string) => void }) {
  const folders = listFolders()
  const moving = new Set(items.map(i => i.id))
  const [to, setTo] = useState<string | null>(from)
  const [open, setOpen] = useState<Set<string>>(new Set(folderPath(from).map(f => f.id)))
  // can't move a folder into itself or its children
  const blocked = (id: string): boolean => { let f = folders.find(x => x.id === id); while (f) { if (moving.has(f.id)) return true; f = folders.find(x => x.id === f!.parentId) } return false }
  const toName = to ? folders.find(f => f.id === to)!.name : 'Documents'

  const Row = ({ f, depth }: { f: Folder; depth: number }) => {
    const kids = folders.filter(c => c.parentId === f.id), no = blocked(f.id), isOpen = open.has(f.id)
    return (
      <li>
        <button disabled={no} onClick={() => setTo(f.id)} style={{ paddingLeft: 12 + depth * 18 }}
          className={`flex h-9 w-full items-center gap-2 rounded-md pr-3 text-left text-[13px] disabled:cursor-not-allowed disabled:opacity-40 ${to === f.id ? 'bg-teal/12 font-medium text-teal-fg' : 'hover:bg-mist'}`}>
          <span onClick={e => { e.stopPropagation(); setOpen(s => { const n = new Set(s); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n }) }}
            className={`grid h-5 w-5 place-items-center rounded text-muted hover:bg-fg/10 ${kids.length ? '' : 'invisible'}`}><ChevronRight size={13} className={isOpen ? 'rotate-90' : ''} /></span>
          <ItemIcon item={f} size={16} /><span className="flex-1 truncate">{f.name}</span>
          {f.id === from && <span className="text-[11px] text-muted">Current</span>}
          {to === f.id && <Check size={14} />}
        </button>
        {isOpen && kids.length > 0 && <ul>{kids.map(k => <Row key={k.id} f={k} depth={depth + 1} />)}</ul>}
      </li>
    )
  }
  return (
    <Dialog open onClose={onClose} width={480} title={`Move ${items.length === 1 ? `“${items[0].name}”` : `${items.length} items`}`} description="Choose where it should go. Access follows the new folder."
      footer={<>
        <span className="mr-auto self-center text-[12.5px] text-muted">To: <span className="font-medium text-fg">{toName}</span></span>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={to === from} onClick={() => onMove(to, toName)}><FolderInput size={15} /> Move here</Button>
      </>}>
      <ul className="max-h-72 overflow-y-auto rounded-md border border-line p-1.5">
        <li>
          <button onClick={() => setTo(null)} className={`flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-[13px] font-medium ${to === null ? 'bg-teal/12 text-teal-fg' : 'hover:bg-mist'}`}>
            <FolderInput size={16} className="text-accent" /> <span className="flex-1">Documents</span>{from === null && <span className="text-[11px] font-normal text-muted">Current</span>}{to === null && <Check size={14} />}
          </button>
        </li>
        {folders.filter(f => !f.parentId).map(f => <Row key={f.id} f={f} depth={1} />)}
      </ul>
    </Dialog>
  )
}

/* ── Share: people + link ── */

function ShareDialog({ item, folderId, onClose, onCopy }: { item: Item | null; folderId: string | null; onClose: () => void; onCopy: () => void }) {
  const name = item?.name ?? folderPath(folderId).at(-1)?.name ?? 'Documents'
  const id = item?.id ?? folderId ?? 'root'
  return (
    <Dialog open onClose={onClose} width={560} title={`Share “${name}”`}
      footer={<>
        <Button variant="secondary" onClick={onCopy} className="mr-auto"><Link2 size={15} /> Copy link</Button>
        <Button variant="primary" onClick={onClose}>Done</Button>
      </>}>
      <Access id={id} />
      <div className="mt-5 flex items-start gap-3 rounded-md bg-mist p-3.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface text-fg/70"><Lock size={15} /></span>
        <div className="flex-1 text-[12.5px]">
          <div className="font-medium">Restricted link</div>
          <div className="text-muted">Only people added above can open it. Public links are turned off by an admin.</div>
        </div>
        <Link to="/settings?section=sharing" className="flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"><Globe size={12} /> Settings</Link>
      </div>
    </Dialog>
  )
}

/* ── Move to trash / Archive ── */

function ConfirmRemove({ kind, items, onClose, onConfirm }: { kind: 'trash' | 'archive'; items: Item[]; onClose: () => void; onConfirm: () => void }) {
  const folders = items.filter(i => i.kind === 'folder')
  const inside = folders.reduce((a, f) => a + (f.kind === 'folder' ? f.itemCount : 0), 0)
  const trash = kind === 'trash'
  return (
    <Dialog open onClose={onClose} width={460}
      title={trash ? `Move ${items.length === 1 ? `“${items[0].name}”` : `${items.length} items`} to trash?` : `Archive ${items.length === 1 ? `“${items[0].name}”` : `${items.length} items`}?`}
      description={trash ? 'You can restore from Trash for 30 days. After that it’s deleted forever.' : 'Archived items are read-only and leave this folder. Restore them any time from Archived.'}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} className={trash ? 'bg-red-600 text-paper hover:bg-red-700' : 'bg-teal text-night hover:brightness-95'}>
          {trash ? <Trash2 size={15} /> : <Archive size={15} />} {trash ? 'Move to trash' : 'Archive'}
        </Button>
      </>}>
      <ul className="max-h-40 space-y-1.5 overflow-y-auto rounded-md bg-mist p-3 text-[12.5px]">
        {items.map(i => <li key={i.id} className="flex items-center gap-2"><ItemIcon item={i} size={14} /><span className="truncate">{i.name}</span><span className="ml-auto shrink-0 text-muted">{i.kind === 'document' ? fmtSize(i.size) : `${i.itemCount} items`}</span></li>)}
      </ul>
      {inside > 0 && <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-amber-600"><AlertCircle size={14} /> Includes {inside} item{inside === 1 ? '' : 's'} inside {folders.length === 1 ? 'this folder' : 'these folders'}.</p>}
    </Dialog>
  )
}

/* ── Upload progress panel (bottom-right) ── */

type Upload = {
  id: string; name: string; size: number; progress: number
  state: 'uploading' | 'conflict' | 'error' | 'done' | 'cancelled'; error?: string; versionOf?: string; doneAt?: number; applied?: boolean
}

function newDoc(u: Upload, folderId: string | null): Document {
  return { kind: 'document', id: `d${u.id}`, name: u.name, folderId, type: 'General', status: 'draft', size: u.size, version: 1, createdAt: now(), createdBy: ME, modifiedAt: now(), modifiedBy: ME, archived: false }
}

function UploadPanel({ uploads, setUploads }: { uploads: Upload[]; setUploads: Dispatch<SetStateAction<Upload[]>> }) {
  const [min, setMin] = useState(false)
  const live = uploads.filter(u => u.state !== 'cancelled')
  if (!live.length) return null
  const active = live.filter(u => u.state === 'uploading').length
  const done = live.filter(u => u.state === 'done').length
  const attention = live.filter(u => u.state === 'conflict' || u.state === 'error').length
  const set = (id: string, p: Partial<Upload>) => setUploads(us => us.map(u => u.id === id ? { ...u, ...p } : u))
  const title = active ? `Uploading ${active} file${active === 1 ? '' : 's'}…` : attention ? `${attention} need${attention === 1 ? 's' : ''} attention` : `${done} upload${done === 1 ? '' : 's'} complete`
  const overall = live.reduce((a, u) => a + (u.state === 'done' ? 100 : u.progress), 0) / live.length

  return (
    <section aria-live="polite" className="fixed bottom-6 right-6 z-40 w-[380px] overflow-hidden rounded-lg border border-line bg-surface shadow-[0_16px_50px_rgba(2,6,23,0.22)]">
      <header className="relative flex items-center gap-3 bg-navy px-4 py-3 text-paper">
        <span className={`grid h-7 w-7 place-items-center rounded-sm ${active ? 'bg-paper/10' : attention ? 'bg-amber-400 text-night' : 'bg-teal text-night'}`}>
          {active ? <FileUp size={14} /> : attention ? <AlertCircle size={14} /> : <Check size={14} />}
        </span>
        <span className="flex-1 text-[13px] font-medium">{title}</span>
        <button onClick={() => setMin(m => !m)} aria-label={min ? 'Expand uploads' : 'Minimise uploads'} className="grid h-7 w-7 place-items-center rounded hover:bg-paper/10">{min ? <ChevronDown size={15} className="rotate-180" /> : <Minus size={15} />}</button>
        {!active && <button onClick={() => setUploads([])} aria-label="Close uploads" className="grid h-7 w-7 place-items-center rounded hover:bg-paper/10"><X size={15} /></button>}
        <span className="absolute inset-x-0 bottom-0 h-[3px] bg-paper/10"><span className="block h-full bg-teal transition-[width]" style={{ width: `${overall}%` }} /></span>
      </header>
      {!min && (
        <ul className="max-h-80 divide-y divide-line overflow-y-auto">
          {live.map(u => (
            <li key={u.id} className="px-4 py-3">
              <div className="flex items-center gap-3">
                <ItemIcon item={{ kind: 'document', name: u.name } as never} size={16} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{u.name}</div>
                  <div className={`text-[11.5px] ${u.state === 'error' ? 'text-red-600' : u.state === 'conflict' ? 'text-amber-600' : 'text-muted'}`}>
                    {u.state === 'uploading' ? `${fmtSize(u.size * u.progress / 100)} of ${fmtSize(u.size)}`
                      : u.state === 'done' ? (u.versionOf ? 'Uploaded as a new version' : `Uploaded · ${fmtSize(u.size)}`)
                      : u.state === 'conflict' ? 'A file with this name is already here'
                      : u.error}
                  </div>
                </div>
                {u.state === 'uploading' && <button onClick={() => set(u.id, { state: 'cancelled' })} aria-label={`Cancel ${u.name}`} className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-mist hover:text-fg"><X size={14} /></button>}
                {u.state === 'done' && <span className="grid h-6 w-6 place-items-center rounded-full bg-teal/15 text-teal-fg"><Check size={13} /></span>}
                {u.state === 'error' && <button onClick={() => set(u.id, { state: 'cancelled' })} aria-label={`Dismiss ${u.name}`} title="Dismiss" className="grid h-7 w-7 place-items-center rounded-md text-red-600 hover:bg-red-500/10"><X size={14} /></button>}
              </div>
              {u.state === 'uploading' && <div className="mt-2 h-1 rounded-[1px] bg-line"><div className="h-1 rounded-[1px] bg-teal transition-[width] duration-200" style={{ width: `${u.progress}%` }} /></div>}
              {u.state === 'conflict' && (
                <div className="mt-2.5 flex gap-2">
                  <button onClick={() => set(u.id, { state: 'uploading' })} className="h-7 rounded-md bg-teal px-2.5 text-[12px] font-medium text-night hover:brightness-95">Upload as new version</button>
                  <button onClick={() => { const dot = u.name.lastIndexOf('.'); set(u.id, { state: 'uploading', versionOf: undefined, name: dot > 0 ? `${u.name.slice(0, dot)} (2)${u.name.slice(dot)}` : `${u.name} (2)` }) }}
                    className="h-7 rounded-md border border-line px-2.5 text-[12px] font-medium hover:bg-mist">Keep both</button>
                  <button onClick={() => set(u.id, { state: 'cancelled' })} className="h-7 px-1.5 text-[12px] text-muted hover:text-fg">Skip</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

