import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Archive, ArrowDown, ArrowUp, Bell, ChevronDown, ChevronRight, Copy, Download, FileUp, FolderInput, FolderPlus,
  FolderUp, LayoutGrid, Link2, List, MoreHorizontal, Pencil, Plus, Share2, Trash2, UploadCloud, X,
} from 'lucide-react'
import { folderPath, listItems, type Item } from '../api'
import { Avatar, Button, ItemIcon, Menu, MenuDivider, MenuItem, StatusBadge, fmtDate, fmtSize } from '../ui'
import { DetailsDrawer } from './DetailsDrawer'

type SortKey = 'name' | 'modifiedAt' | 'size'
const TYPES = ['Contract', 'Policy', 'Report', 'General']

export default function Documents() {
  const { folderId = null } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const openId = params.get('item')

  const [items, setItems] = useState<Item[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [type, setType] = useState<string | null>(null)
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'name', asc: true })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    setItems(null); setSelected(new Set())
    listItems(folderId).then(setItems)
  }, [folderId])

  const path = folderPath(folderId)
  const title = path.at(-1)?.name ?? 'Documents'

  const rows = useMemo(() => {
    if (!items) return []
    const f = items.filter(i => !type || (i.kind === 'document' && i.type === type))
    const val = (i: Item) => sort.key === 'size' ? (i.kind === 'document' ? i.size : -1) : i[sort.key]
    // folders always first, like every file manager
    return f.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'folder' ? -1 : 1)
      || (val(a) < val(b) ? -1 : val(a) > val(b) ? 1 : 0) * (sort.asc ? 1 : -1))
  }, [items, type, sort])

  const open = (i: Item) => i.kind === 'folder' ? navigate(`/documents/${i.id}`) : setParams({ item: i.id })
  const toggle = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allSelected = rows.length > 0 && selected.size === rows.length

  const SortHead = ({ k, children, className = '' }: { k: SortKey; children: string; className?: string }) => (
    <button onClick={() => setSort(s => ({ key: k, asc: s.key === k ? !s.asc : true }))}
      className={`inline-flex items-center gap-1 hover:text-fg ${className}`}>
      {children}
      {sort.key === k && (sort.asc ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
    </button>
  )

  return (
    <div className="relative min-h-full px-8 py-7"
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={e => e.currentTarget === e.target && setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false) }}>

      {/* Breadcrumbs */}
      <nav className={`flex items-center gap-1 text-[13px] text-muted ${folderId ? '' : 'invisible'}`}>
        <Link to="/documents" className="hover:text-fg">Documents</Link>
        {path.map(f => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight size={13} />
            <Link to={`/documents/${f.id}`} className={f.id === folderId ? 'text-fg' : 'hover:text-fg'}>{f.name}</Link>
          </span>
        ))}
      </nav>

      {/* Header */}
      <div className="mt-2 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">{title}</h1>
          <p className="mt-0.5 text-[13px] text-muted">{items ? `${items.length} items` : ' '}</p>
        </div>
        <div className="flex items-center gap-1">
          {folderId && <Button><Share2 size={15} /> Share</Button>}
          {folderId && <Button><Link2 size={15} /> Copy link</Button>}
          <Menu trigger={<Button variant="primary" className="ml-2"><Plus size={15} /> New <ChevronDown size={14} className="-mr-1 opacity-60" /></Button>}>
            <MenuItem icon={FolderPlus} hint="⇧N">New folder</MenuItem>
            <MenuDivider />
            <MenuItem icon={FileUp} hint="U">Upload files</MenuItem>
            <MenuItem icon={FolderUp}>Upload folder</MenuItem>
            <MenuDivider />
            <MenuItem icon={Link2}>Add link</MenuItem>
          </Menu>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex h-9 items-center gap-2">
        {selected.size > 0 ? (
          <div className="flex h-9 flex-1 items-center gap-1 rounded-md bg-navy pl-3 pr-1 text-paper">
            <span className="mr-2 text-[13px] font-medium">{selected.size} selected</span>
            {[[Download, 'Download'], [Share2, 'Share'], [FolderInput, 'Move'], [Archive, 'Archive'], [Trash2, 'Move to trash']].map(([Icon, label]) => {
              const I = Icon as typeof Download
              return <button key={label as string} className="inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-[12.5px] text-paper/80 hover:bg-paper/10 hover:text-paper"><I size={14} />{label as string}</button>
            })}
            <button onClick={() => setSelected(new Set())} className="ml-auto grid h-7 w-7 place-items-center rounded hover:bg-paper/10" aria-label="Clear selection"><X size={15} /></button>
          </div>
        ) : (
          <>
            <Chip active={!type} onClick={() => setType(null)}>All</Chip>
            {TYPES.map(t => <Chip key={t} active={type === t} onClick={() => setType(type === t ? null : t)}>{t}</Chip>)}
            <div className="ml-auto flex rounded-md border border-line p-0.5">
              {([['list', List], ['grid', LayoutGrid]] as const).map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v)} aria-label={`${v} view`}
                  className={`grid h-7 w-8 place-items-center rounded ${view === v ? 'bg-mist text-fg' : 'text-muted hover:text-fg'}`}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="mt-3">
        {!items ? <Skeleton /> : rows.length === 0 ? <Empty filtered={!!type} /> : view === 'list' ? (
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr className="text-left text-[12px] text-muted [&>th]:h-10 [&>th]:border-b [&>th]:border-line [&>th]:font-medium">
                <th className="w-10 pl-3"><Check checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map(r => r.id)))} /></th>
                <th><SortHead k="name">Name</SortHead></th>
                <th className="w-32">Type</th>
                <th className="w-32">Status</th>
                <th className="w-48"><SortHead k="modifiedAt">Last modified</SortHead></th>
                <th className="w-24 pr-4 text-right"><SortHead k="size" className="justify-end">Size</SortHead></th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {rows.map(i => {
                const sel = selected.has(i.id), active = openId === i.id
                return (
                  <tr key={i.id} onClick={() => open(i)}
                    className={`group cursor-pointer [&>td]:h-12 [&>td]:border-b [&>td]:border-line ${sel || active ? 'bg-teal/8' : 'hover:bg-mist/60'}`}>
                    <td className="pl-3" onClick={e => e.stopPropagation()}><Check checked={sel} onChange={() => toggle(i.id)} /></td>
                    <td>
                      <div className="flex items-center gap-3">
                        <ItemIcon item={i} />
                        <span className="truncate font-medium">{i.name}</span>
                        {i.kind === 'folder' && <span className="text-[12px] text-muted">{i.itemCount}</span>}
                      </div>
                    </td>
                    <td className="text-fg/70">{i.kind === 'document' ? i.type : 'Folder'}</td>
                    <td>{i.kind === 'document' ? <StatusBadge status={i.status} /> : <Dash />}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar user={i.modifiedBy} size={22} />
                        <span className="text-fg/70">{fmtDate(i.modifiedAt)}</span>
                      </div>
                    </td>
                    <td className="pr-4 text-right tabular-nums text-fg/70">{i.kind === 'document' ? fmtSize(i.size) : <Dash />}</td>
                    <td className="pr-2"><RowMenu item={i} onOpen={() => open(i)} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {rows.map(i => (
              <div key={i.id} onClick={() => open(i)}
                className={`group cursor-pointer rounded-lg border p-4 transition-colors ${openId === i.id || selected.has(i.id) ? 'border-teal bg-teal/5' : 'border-line hover:border-muted/60'}`}>
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-mist"><ItemIcon item={i} size={20} /></div>
                  <RowMenu item={i} onOpen={() => open(i)} />
                </div>
                <div className="mt-4 truncate text-[13px] font-medium">{i.name}</div>
                <div className="mt-1 flex items-center justify-between text-[12px] text-muted">
                  <span>{i.kind === 'folder' ? `${i.itemCount} items` : fmtSize(i.size)}</span>
                  {i.kind === 'document' && <StatusBadge status={i.status} />}
                </div>
              </div>
            ))}
          </div>
        )}
        {items && rows.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-[12px] text-muted">
            <span>Showing {rows.length} of {items.length}</span>
            <span>Drag files anywhere to upload</span>
          </div>
        )}
      </div>

      {dragging && (
        <div className="pointer-events-none absolute inset-3 z-20 grid place-items-center rounded-xl border-2 border-dashed border-teal bg-teal/5">
          <div className="text-center">
            <UploadCloud size={28} className="mx-auto text-teal" />
            <div className="mt-2 text-[14px] font-medium">Drop to upload to {title}</div>
          </div>
        </div>
      )}

      {openId && <DetailsDrawer id={openId} onClose={() => setParams({})} />}
    </div>
  )
}

function RowMenu({ item, onOpen }: { item: Item; onOpen: () => void }) {
  return (
    <Menu trigger={
      <button className="grid h-8 w-8 place-items-center rounded-md text-muted opacity-0 hover:bg-surface hover:text-fg group-hover:opacity-100 aria-expanded:opacity-100" aria-label="More actions">
        <MoreHorizontal size={16} />
      </button>
    }>
      <MenuItem onClick={onOpen} icon={item.kind === 'folder' ? FolderInput : Pencil}>{item.kind === 'folder' ? 'Open' : 'Details'}</MenuItem>
      {item.kind === 'document' && <MenuItem icon={Download}>Download</MenuItem>}
      <MenuItem icon={Share2}>Share</MenuItem>
      <MenuItem icon={Copy}>Copy link</MenuItem>
      <MenuItem icon={Bell}>Alert me</MenuItem>
      <MenuDivider />
      <MenuItem icon={Pencil}>Rename</MenuItem>
      <MenuItem icon={FolderInput}>Move</MenuItem>
      <MenuItem icon={Archive}>Archive</MenuItem>
      <MenuDivider />
      <MenuItem icon={Trash2} danger>Move to trash</MenuItem>
    </Menu>
  )
}

function Chip({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`h-8 rounded-sm border px-3 text-[12.5px] font-medium transition-colors ${active ? 'border-navy bg-navy text-paper' : 'border-line text-fg/70 hover:border-muted/60 hover:text-fg'}`}>
      {children}
    </button>
  )
}

const Check = ({ checked, onChange }: { checked: boolean; onChange: () => void }) =>
  <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 cursor-pointer rounded accent-teal" />

const Dash = () => <span className="text-muted">—</span>

function Skeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex h-12 items-center gap-4 border-b border-line px-3">
          <div className="h-4 w-4 rounded bg-mist" /><div className="h-4 w-4 rounded bg-mist" />
          <div className="h-3 animate-pulse rounded bg-mist" style={{ width: `${30 + (i * 13) % 30}%` }} />
        </div>
      ))}
    </div>
  )
}

function Empty({ filtered }: { filtered: boolean }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line py-20 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-sm bg-mist"><UploadCloud size={20} className="text-fg/60" /></div>
      <div className="mt-4 text-[15px] font-medium">{filtered ? 'Nothing matches this filter' : 'This folder is empty'}</div>
      <p className="mt-1 max-w-xs text-[13px] text-muted">
        {filtered ? 'Try another document type, or clear the filter.' : 'Drag files here, or use New to upload files or create a subfolder.'}
      </p>
      {!filtered && <div className="mt-5 flex gap-2"><Button variant="secondary"><FolderPlus size={15} /> New folder</Button><Button variant="primary"><FileUp size={15} /> Upload files</Button></div>}
    </div>
  )
}
