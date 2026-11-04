// Full-page document view ("Open"). Big preview on the left, the same Details / Versions / Access / Activity
// as the drawer on the right, and a review bar when the file is waiting for review.
// Backend: GET /items/:id · GET /documents/:id/preview?page= (rendered pages) · POST /documents/:id/review
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Archive, ArrowLeft, Bell, BellRing, Check, ChevronLeft, ChevronRight, Download, FolderInput, Link2, Minus,
  MoreHorizontal, Pencil, Plus, Share2, Trash2, Upload, X,
} from 'lucide-react'
import { folderPath, getItem, TYPE_COLORS } from '../api'
import { excerpts } from '../mock'
import { useFileActions } from '../fileActions'
import { RESTRICTED_FOR_MEMBERS, useMe } from '../session'
import type { Document, Item } from '../types'
import { Avatar, Menu, MenuDivider, MenuItem, StatusBadge, fmtDate, fmtSize, useToast } from '../ui'
import { Access, ActivityList, Details, Versions } from './DetailsDrawer'
import { NoAccessPage, NotFoundPage } from './ErrorPages'

const TABS = ['Details', 'Versions', 'Access', 'Activity'] as const
const PAGES = 4 // ponytail: mock page count; the preview endpoint returns the real one

export default function DocumentPage() {
  const { id = '' } = useParams()
  const me = useMe()
  const found = getItem(id)
  if (!found || found.kind !== 'document') return <NotFoundPage />
  if (!me.isAdmin && found.folderId && RESTRICTED_FOR_MEMBERS.includes(found.folderId)) return <NoAccessPage folderId={found.folderId} />
  return <Viewer key={id} doc={found} />
}

function Viewer({ doc: initial }: { doc: Document }) {
  const navigate = useNavigate()
  const me = useMe()
  const [list, setList] = useState<Item[] | null>([initial])
  const doc = list?.find(x => x.id === initial.id) as Document | undefined
  const { act, ui } = useFileActions({ folderId: initial.folderId, items: list, setItems: setList })
  const [tab, setTab] = useState<typeof TABS[number]>('Details')
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [review, setReview] = useState(initial.status === 'in_review' && initial.modifiedBy.id !== me.id)
  const [toast, showToast] = useToast()
  const back = `/documents/${initial.folderId ?? ''}`

  // trashed or archived from here → back to its folder
  useEffect(() => { if (!doc) navigate(back) }, [doc, back, navigate])
  if (!doc) return null

  const crumbs = folderPath(doc.folderId)
  const decide = (status: Document['status'], msg: string) => { setReview(false); setList(xs => xs && xs.map(x => x.id === doc.id ? { ...x, status } : x)); showToast(msg) }

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      {/* Header */}
      <header className="border-b border-line bg-surface px-6 py-3.5">
        <div className="flex items-center gap-3">
          <Link to={back} aria-label="Back to folder" className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-mist hover:text-fg"><ArrowLeft size={17} /></Link>
          <span className="h-9 w-1 rounded-full" style={{ background: TYPE_COLORS[doc.type] }} />
          <div className="min-w-0 flex-1">
            <nav className="flex items-center gap-1 truncate text-[12px] text-muted">
              <Link to="/documents" className="hover:text-fg">Documents</Link>
              {crumbs.map(f => <span key={f.id} className="flex items-center gap-1"><ChevronRight size={12} /><Link to={`/documents/${f.id}`} className="hover:text-fg">{f.name}</Link></span>)}
            </nav>
            <div className="flex items-center gap-2.5">
              <h1 className="truncate text-[17px] font-semibold tracking-tight">{doc.name}</h1>
              <span className="shrink-0"><StatusBadge status={doc.status} /></span>
              <span className="whitespace-nowrap text-[12px] text-muted">v{doc.version} · {fmtSize(doc.size)}</span>
            </div>
          </div>
          <Btn icon={act.isFollowing(doc) ? BellRing : Bell} label={act.isFollowing(doc) ? 'Stop alerts' : 'Alert me'} active={act.isFollowing(doc)} onClick={() => act.toggleFollow(doc)} />
          <Btn icon={Link2} label="Copy link" onClick={() => act.copyLink(doc)} />
          <Menu trigger={<Btn icon={MoreHorizontal} label="More" />}>
            <MenuItem icon={Pencil} onClick={() => act.rename(doc)}>Rename</MenuItem>
            <MenuItem icon={FolderInput} onClick={() => act.move([doc])}>Move</MenuItem>
            <MenuItem icon={Upload} onClick={() => act.uploadVersion(doc)}>Upload new version</MenuItem>
            <MenuItem icon={Archive} onClick={() => act.archive([doc])}>Archive</MenuItem>
            <MenuDivider />
            <MenuItem icon={Trash2} danger onClick={() => act.trash([doc])}>Move to trash</MenuItem>
          </Menu>
          <button onClick={() => act.download([doc])} className="inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-[13px] font-medium ring-1 ring-line hover:bg-mist"><Download size={15} /> Download</button>
          <button onClick={() => act.share(doc)} className="inline-flex h-9 items-center gap-2 rounded-md bg-navy px-3.5 text-[13px] font-medium text-paper hover:brightness-110"><Share2 size={15} /> Share</button>
        </div>
      </header>

      {/* Review bar */}
      {review && (
        <div className="brand-banner relative flex items-center gap-3 overflow-hidden px-6 py-3 text-paper">
          <Avatar user={doc.modifiedBy} size={28} />
          <p className="relative flex-1 text-[13px]"><span className="font-medium">{doc.modifiedBy.name}</span> <span className="text-paper/75">asked for your review · {fmtDate(doc.modifiedAt)}</span></p>
          {/* Backend: POST /documents/:id/review { decision: 'approve' | 'changes' } */}
          <button onClick={() => decide('draft', 'Changes requested')} className="relative inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium ring-1 ring-paper/25 hover:bg-paper/10"><X size={14} /> Request changes</button>
          <button onClick={() => decide('approved', `${doc.name} approved`)} className="relative inline-flex h-8 items-center gap-1.5 rounded-md bg-teal px-3 text-[12.5px] font-medium text-night hover:brightness-95"><Check size={14} /> Approve</button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Preview */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-auto px-8 py-8">
            <Paper doc={doc} page={page} zoom={zoom} />
          </div>
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-night/90 px-1.5 py-1 text-[12px] text-paper shadow-lg backdrop-blur">
            <Ctl icon={ChevronLeft} label="Previous page" disabled={page === 1} onClick={() => setPage(p => p - 1)} />
            <span className="w-16 text-center tabular-nums">{page} / {PAGES}</span>
            <Ctl icon={ChevronRight} label="Next page" disabled={page === PAGES} onClick={() => setPage(p => p + 1)} />
            <span className="mx-1 h-4 w-px bg-paper/20" />
            <Ctl icon={Minus} label="Zoom out" disabled={zoom <= 50} onClick={() => setZoom(z => z - 25)} />
            <button onClick={() => setZoom(100)} className="w-12 rounded text-center tabular-nums hover:bg-paper/10">{zoom}%</button>
            <Ctl icon={Plus} label="Zoom in" disabled={zoom >= 200} onClick={() => setZoom(z => z + 25)} />
          </div>
        </main>

        {/* Side panel */}
        <aside className="flex w-[380px] shrink-0 flex-col border-l border-line bg-surface">
          <div className="flex gap-5 border-b border-line px-6 pt-4">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`-mb-px border-b-2 pb-2.5 text-[13px] font-medium ${tab === t ? 'border-teal text-accent' : 'border-transparent text-muted hover:text-fg'}`}>{t}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {tab === 'Details' && <Details item={doc} preview={false} />}
            {tab === 'Versions' && <Versions id={doc.id} />}
            {tab === 'Access' && <Access id={doc.id} />}
            {tab === 'Activity' && <ActivityList id={doc.id} />}
          </div>
        </aside>
      </div>
      {ui}{toast}
    </div>
  )
}

/** Mock rendered page: the real app shows GET /documents/:id/preview?page= here. */
function Paper({ doc, page, zoom }: { doc: Document; page: number; zoom: number }) {
  const lines = [92, 100, 96, 88, 100, 71, 0, 100, 94, 98, 83, 0, 100, 97, 64]
  return (
    <article className="mx-auto rounded-sm bg-white p-14 text-[#020617] shadow-[0_2px_24px_rgba(2,6,23,0.12)]"
      style={{ width: 640, maxWidth: '100%', aspectRatio: '1 / 1.414', zoom: zoom / 100 }}>
      <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4 text-[10px] uppercase tracking-[0.18em] text-[#94a3b8]">
        <span>Harbour &amp; Hills</span><span>{doc.type}</span>
      </div>
      {page === 1 ? <>
        <h2 className="mt-10 text-[24px] font-semibold tracking-tight">{doc.name.replace(/\.\w+$/, '')}</h2>
        <p className="mt-2 text-[11px] text-[#94a3b8]">{doc.createdBy.name} · {fmtDate(doc.createdAt)}</p>
        {excerpts[doc.id] && <p className="mt-8 border-l-2 border-[#00bfb3] pl-4 text-[13px] leading-relaxed">{excerpts[doc.id]}</p>}
      </> : <h3 className="mt-10 text-[14px] font-semibold">Section {page}</h3>}
      <div className="mt-8 space-y-2.5">
        {lines.map((w, i) => w ? <div key={i} className="h-2 rounded-full bg-[#f1f5f9]" style={{ width: `${w}%` }} /> : <div key={i} className="h-3" />)}
      </div>
      <div className="mt-10 text-center text-[10px] text-[#94a3b8]">{page}</div>
    </article>
  )
}

const Btn = ({ icon: I, label, onClick, active }: { icon: typeof X; label: string; onClick?: () => void; active?: boolean }) =>
  <button onClick={onClick} title={label} aria-label={label} aria-pressed={active}
    className={`grid h-9 w-9 place-items-center rounded-md ${active ? 'bg-teal/15 text-teal-fg' : 'text-fg/70 hover:bg-mist hover:text-fg'}`}><I size={16} strokeWidth={1.75} /></button>

const Ctl = ({ icon: I, label, onClick, disabled }: { icon: typeof X; label: string; onClick: () => void; disabled?: boolean }) =>
  <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className="grid h-7 w-7 place-items-center rounded hover:bg-paper/10 disabled:opacity-30"><I size={15} /></button>
