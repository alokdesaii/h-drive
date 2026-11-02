import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, ChevronRight, MoreHorizontal, RotateCcw, Search, Sparkles, Trash2, X } from 'lucide-react'
import { TYPE_COLORS, listArchived, listTrash } from '../api'
import type { RemovedItem } from '../types'
import { Avatar, Button, Dialog, ItemIcon, Menu, MenuItem, fmtDate, fmtSize, useToast } from '../ui'

type Mode = 'archived' | 'trash'
const NOW = Date.parse('2026-10-13T12:00:00Z')
const RETENTION = 30 // days, from Settings → Storage & retention (GET /admin/settings)
const daysLeft = (r: RemovedItem) => RETENTION - Math.floor((NOW - Date.parse(r.removedAt)) / 86400000)
const sizeOf = (r: RemovedItem) => r.item.kind === 'document' ? r.item.size : r.item.itemCount * 1.8 * 1024 ** 2 // folders: backend sends total size

const COPY = {
  archived: {
    title: 'Archived', icon: Archive, verb: 'Archived',
    desc: 'Files put away to keep things tidy. Read-only, searchable from here, and kept until someone restores or deletes them.',
    empty: ['Nothing archived', 'Archive old files from Documents to keep folders tidy without deleting anything.'],
  },
  trash: {
    title: 'Trash', icon: Trash2, verb: 'Deleted',
    desc: `Deleted files and folders. Restore anything within ${RETENTION} days; after that it’s deleted forever.`,
    empty: ['Trash is empty', 'Deleted files land here and can be restored for 30 days.'],
  },
} as const

export default function RemovedPage({ mode }: { mode: Mode }) {
  const c = COPY[mode]
  const [rows, setRows] = useState<RemovedItem[] | null>(null)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<{ kind: 'delete' | 'empty'; items: RemovedItem[] } | null>(null)
  const [toast, showToast] = useToast()

  useEffect(() => { setRows(null); setSelected(new Set()); setQ(''); (mode === 'trash' ? listTrash : listArchived)().then(setRows) }, [mode])

  const all = rows ?? []
  const shown = useMemo(() => all.filter(r => r.item.name.toLowerCase().includes(q.toLowerCase())), [all, q])
  const totalSize = all.reduce((a, r) => a + sizeOf(r), 0)
  const soon = mode === 'trash' ? all.filter(r => daysLeft(r) <= 7).length : 0
  const picked = all.filter(r => selected.has(r.item.id))

  const drop = (ids: string[]) => { setRows(rs => rs!.filter(r => !ids.includes(r.item.id))); setSelected(new Set()) }
  const restore = (items: RemovedItem[]) => {
    drop(items.map(r => r.item.id))
    showToast(items.length === 1 ? `“${items[0].item.name}” restored to ${['Documents', ...items[0].originalPath].join(' / ')}` : `${items.length} items restored to their original folders`)
  }
  const toTrash = (items: RemovedItem[]) => { drop(items.map(r => r.item.id)); showToast(`${items.length === 1 ? `“${items[0].item.name}”` : `${items.length} items`} moved to Trash`) }
  const toggle = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allOn = shown.length > 0 && shown.every(r => selected.has(r.item.id))

  return (
    <div className="min-h-full bg-canvas px-8 py-7">
      {/* Banner */}
      <header className="brand-banner relative overflow-hidden rounded-lg px-6 py-6 text-paper">
        <div className="relative flex items-center gap-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-teal text-night"><c.icon size={22} strokeWidth={1.75} /></span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-semibold tracking-tight">{c.title}</h1>
            <p className="mt-0.5 max-w-xl text-[13px] text-paper/65">{c.desc}</p>
          </div>
          <BannerStat value={rows ? all.length.toLocaleString() : '–'} label={all.length === 1 ? 'item' : 'items'} />
          <BannerStat value={rows ? fmtSize(totalSize) : '–'} label="space used" />
          {mode === 'trash' && <BannerStat value={rows ? soon : '–'} label="deleted within 7 days" warn={soon > 0} />}
          {mode === 'trash' && (
            <Button disabled={!all.length} onClick={() => setConfirm({ kind: 'empty', items: all })} className="ml-1 bg-paper/10 text-paper ring-1 ring-paper/20 hover:bg-red-500/90 hover:ring-red-500">
              <Trash2 size={15} /> Empty trash
            </Button>
          )}
        </div>
      </header>

      {mode === 'archived' && (
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-muted">
          <Sparkles size={13} className="text-teal" /> Files nobody opens for a year are archived automatically.
          <Link to="/settings?section=retention" className="font-medium text-accent hover:underline">Change rule</Link>
        </p>
      )}
      {mode === 'trash' && (
        <p className="mt-3 text-[12.5px] text-muted">
          Items are deleted forever {RETENTION} days after they’re moved here. <Link to="/settings?section=retention" className="font-medium text-accent hover:underline">Change in Settings</Link>
        </p>
      )}

      {/* Toolbar / bulk bar */}
      <div className="mt-5 flex h-10 items-center gap-2">
        {selected.size > 0 ? (
          <div className="flex h-10 flex-1 items-center gap-1 rounded-md bg-navy pl-4 pr-1 text-paper">
            <span className="mr-2 text-[13px] font-medium">{selected.size} selected</span>
            <BulkBtn icon={RotateCcw} onClick={() => restore(picked)}>Restore</BulkBtn>
            {mode === 'archived'
              ? <BulkBtn icon={Trash2} onClick={() => toTrash(picked)}>Move to trash</BulkBtn>
              : <BulkBtn icon={Trash2} onClick={() => setConfirm({ kind: 'delete', items: picked })}>Delete forever</BulkBtn>}
            <button onClick={() => setSelected(new Set())} aria-label="Clear selection" className="ml-auto grid h-8 w-8 place-items-center rounded hover:bg-paper/10"><X size={15} /></button>
          </div>
        ) : (
          <div className="relative w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${c.title.toLowerCase()}`}
              className="h-10 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-[13px] outline-none placeholder:text-muted focus:border-teal" />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="mt-3 overflow-hidden rounded-lg bg-surface shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
        {!rows ? (
          <div className="space-y-4 p-6">{[60, 40, 75, 50].map(w => <div key={w} className="h-3 animate-pulse rounded bg-mist" style={{ width: `${w}%` }} />)}</div>
        ) : shown.length === 0 ? (
          <div className="grid place-items-center py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-md bg-teal/12 text-teal-fg"><c.icon size={22} /></span>
            <div className="mt-4 text-[15px] font-medium">{q ? `Nothing matches “${q}”` : c.empty[0]}</div>
            <p className="mt-1 max-w-sm text-[13px] text-muted">{q ? 'Try another name.' : c.empty[1]}</p>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="text-left text-[12px] text-muted">
              <tr className="[&>th]:h-11 [&>th]:border-b [&>th]:border-line [&>th]:font-medium">
                <th className="w-12 pl-5"><input type="checkbox" checked={allOn} onChange={() => setSelected(allOn ? new Set() : new Set(shown.map(r => r.item.id)))} className="h-4 w-4 accent-teal" aria-label="Select all" /></th>
                <th>Name</th>
                <th className="w-36">Type</th>
                <th className="w-52">{c.verb}</th>
                {mode === 'trash' && <th className="w-40">Deleted forever in</th>}
                <th className="w-24 text-right">Size</th>
                <th className="w-40" />
              </tr>
            </thead>
            <tbody className="[&>tr>td]:h-16 [&>tr>td]:border-b [&>tr>td]:border-line [&>tr:last-child>td]:border-0">
              {shown.map(r => {
                const left = daysLeft(r), on = selected.has(r.item.id)
                return (
                  <tr key={r.item.id} className={`group ${on ? 'bg-teal/[0.06]' : 'hover:bg-teal/[0.03]'}`}>
                    <td className="pl-5"><input type="checkbox" checked={on} onChange={() => toggle(r.item.id)} className="h-4 w-4 accent-teal" aria-label={`Select ${r.item.name}`} /></td>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md bg-mist ${mode === 'trash' ? 'opacity-70' : ''}`}><ItemIcon item={r.item} size={17} /></span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 truncate font-medium">{r.item.name}{r.auto && <span className="rounded-sm bg-mist px-1.5 text-[10.5px] font-normal text-muted">Auto</span>}</div>
                          <div className="flex items-center gap-1 text-[11.5px] text-muted">
                            {['Documents', ...r.originalPath].map((p, i, a) => <span key={i} className="flex items-center gap-1">{p}{i < a.length - 1 && <ChevronRight size={10} />}</span>)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="text-fg/70">
                      {r.item.kind === 'document'
                        ? <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: TYPE_COLORS[r.item.type] }} />{r.item.type}</span>
                        : `Folder · ${r.item.itemCount} items`}
                    </td>
                    <td><span className="flex items-center gap-2">{r.auto ? <span className="grid h-[22px] w-[22px] place-items-center rounded-sm bg-teal/15 text-teal-fg"><Sparkles size={12} /></span> : <Avatar user={r.removedBy} size={22} />}<span><span className="block text-fg/80">{r.auto ? 'Auto-archive' : r.removedBy.name}</span><span className="block text-[11.5px] text-muted">{fmtDate(r.removedAt)}</span></span></span></td>
                    {mode === 'trash' && (
                      <td>
                        <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[12px] font-medium ${left <= 3 ? 'bg-red-500/10 text-red-600' : left <= 7 ? 'bg-amber-500/12 text-amber-700' : 'bg-mist text-fg/70'}`}>
                          {left <= 0 ? 'Today' : `${left} day${left === 1 ? '' : 's'}`}
                        </span>
                        <div className="mt-1.5 h-1 w-24 rounded-[1px] bg-line"><div className={`h-1 rounded-[1px] ${left <= 7 ? 'bg-red-500/70' : 'bg-teal'}`} style={{ width: `${Math.max(4, (left / RETENTION) * 100)}%` }} /></div>
                      </td>
                    )}
                    <td className="text-right tabular-nums text-fg/70">{fmtSize(sizeOf(r))}</td>
                    <td className="pr-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => restore([r])} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line px-2.5 text-[12.5px] font-medium opacity-0 hover:border-teal hover:text-teal-fg focus:opacity-100 group-hover:opacity-100">
                          <RotateCcw size={13} /> Restore
                        </button>
                        <Menu trigger={<button aria-label={`More actions for ${r.item.name}`} className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-mist hover:text-fg"><MoreHorizontal size={16} /></button>}>
                          <MenuItem icon={RotateCcw} onClick={() => restore([r])}>Restore</MenuItem>
                          {mode === 'archived'
                            ? <MenuItem icon={Trash2} danger onClick={() => toTrash([r])}>Move to trash</MenuItem>
                            : <MenuItem icon={Trash2} danger onClick={() => setConfirm({ kind: 'delete', items: [r] })}>Delete forever</MenuItem>}
                        </Menu>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmForever value={confirm} onClose={() => setConfirm(null)} onConfirm={() => {
        const n = confirm!.items.length
        drop(confirm!.items.map(r => r.item.id)); setConfirm(null)
        showToast(confirm!.kind === 'empty' ? 'Trash emptied' : `${n === 1 ? `“${confirm!.items[0].item.name}”` : `${n} items`} deleted forever`)
      }} />
      {toast}
    </div>
  )
}

function BannerStat({ value, label, warn }: { value: string | number; label: string; warn?: boolean }) {
  return (
    <div className="shrink-0 border-l border-paper/15 pl-5 text-right">
      <div className={`text-[26px] font-bold leading-none tabular-nums ${warn ? 'text-[#fda4af]' : ''}`}>{value}</div>
      <div className="mt-1.5 text-[11.5px] text-teal">{label}</div>
    </div>
  )
}

function BulkBtn({ icon: Icon, onClick, children }: { icon: typeof Trash2; onClick: () => void; children: string }) {
  return <button onClick={onClick} className="inline-flex h-8 items-center gap-1.5 rounded px-3 text-[12.5px] text-paper/85 hover:bg-paper/10 hover:text-paper"><Icon size={14} />{children}</button>
}

/** Permanent delete: says exactly what goes, and needs an explicit tick. */
function ConfirmForever({ value, onClose, onConfirm }: { value: { kind: 'delete' | 'empty'; items: RemovedItem[] } | null; onClose: () => void; onConfirm: () => void }) {
  const [ok, setOk] = useState(false)
  useEffect(() => setOk(false), [value])
  const n = value?.items.length ?? 0
  const size = value ? value.items.reduce((a, r) => a + sizeOf(r), 0) : 0
  return (
    <Dialog open={!!value} onClose={onClose}
      title={value?.kind === 'empty' ? 'Empty trash?' : n === 1 ? `Delete “${value?.items[0].item.name}” forever?` : `Delete ${n} items forever?`}
      description={`${n} item${n === 1 ? '' : 's'} · ${fmtSize(size)}. This can’t be undone, and they can’t be recovered from version history.`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button disabled={!ok} onClick={onConfirm} className="bg-red-600 text-paper hover:bg-red-700"><Trash2 size={15} /> {value?.kind === 'empty' ? 'Empty trash' : 'Delete forever'}</Button>
      </>}>
      <ul className="max-h-44 space-y-1.5 overflow-y-auto rounded-md bg-mist p-3 text-[12.5px]">
        {value?.items.map(r => <li key={r.item.id} className="flex items-center gap-2"><ItemIcon item={r.item} size={14} /><span className="truncate">{r.item.name}</span><span className="ml-auto shrink-0 text-muted">{fmtSize(sizeOf(r))}</span></li>)}
      </ul>
      <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[13px]">
        <input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} className="mt-0.5 h-4 w-4 accent-red-600" />
        I understand {n === 1 ? 'this item' : 'these items'} will be permanently deleted.
      </label>
    </Dialog>
  )
}
