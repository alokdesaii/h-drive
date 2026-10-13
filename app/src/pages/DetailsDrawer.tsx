import { useEffect, useState } from 'react'
import { Archive, Bell, Download, Eye, Link2, MoreHorizontal, Pencil, RotateCcw, Share2, Trash2, Upload, X } from 'lucide-react'
import { folderPath, getItem, listAccess, listActivity, listVersions } from '../api'
import type { AccessGrant, Activity, Item, Version } from '../types'
import { Avatar, Button, ItemIcon, Menu, MenuDivider, MenuItem, StatusBadge, fmtDateTime, fmtSize } from '../ui'

const TABS = ['Details', 'Versions', 'Access', 'Activity'] as const
type Tab = typeof TABS[number]

export function DetailsDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const item = getItem(id)
  const [tab, setTab] = useState<Tab>('Details')

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])
  useEffect(() => setTab('Details'), [id])

  if (!item) return null
  const tabs = item.kind === 'folder' ? TABS.filter(t => t !== 'Versions') : TABS
  const location = ['Documents', ...folderPath(item.kind === 'folder' ? item.parentId : item.folderId).map(f => f.name)].join(' / ')

  return (
    <>
      {/* no backdrop: the list stays clickable so users can flick between files */}
      <aside role="dialog" aria-label={`${item.name} details`}
        className="fixed inset-y-0 right-0 z-50 flex w-[440px] max-w-full flex-col border-l border-line bg-surface shadow-[-12px_0_40px_rgba(2,6,23,0.08)] animate-[slidein_.18s_ease-out]">
        <header className="px-6 pt-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-mist"><ItemIcon item={item} size={20} /></div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-semibold">{item.name}</h2>
              <p className="truncate text-[12px] text-muted">{location}</p>
            </div>
            <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-mist hover:text-fg" aria-label="Close"><X size={17} /></button>
          </div>
          <div className="mt-4 flex items-center gap-1">
            {item.kind === 'document' && <Button variant="primary"><Eye size={15} /> Open</Button>}
            {item.kind === 'document' && <IconBtn icon={Download} label="Download" />}
            <IconBtn icon={Share2} label="Share" />
            <IconBtn icon={Link2} label="Copy link" />
            <IconBtn icon={Bell} label="Alert me" />
            <Menu trigger={<IconBtn icon={MoreHorizontal} label="More" />}>
              <MenuItem icon={Pencil}>Rename</MenuItem>
              {item.kind === 'document' && <MenuItem icon={Upload}>Upload new version</MenuItem>}
              <MenuItem icon={Archive}>Archive</MenuItem>
              <MenuDivider />
              <MenuItem icon={Trash2} danger>Move to trash</MenuItem>
            </Menu>
          </div>
          <div className="mt-5 flex gap-5 border-b border-line">
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`-mb-px border-b-2 pb-2.5 text-[13px] font-medium ${tab === t ? 'border-teal text-accent' : 'border-transparent text-muted hover:text-fg'}`}>
                {t}
              </button>
            ))}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'Details' && <Details item={item} />}
          {tab === 'Versions' && <Versions id={id} />}
          {tab === 'Access' && <Access id={id} />}
          {tab === 'Activity' && <ActivityList id={id} />}
        </div>
      </aside>
    </>
  )
}

const IconBtn = ({ icon: I, label }: { icon: typeof X; label: string }) =>
  <button title={label} aria-label={label} className="grid h-9 w-9 place-items-center rounded-md text-fg/70 hover:bg-mist hover:text-fg"><I size={16} strokeWidth={1.75} /></button>

function Details({ item }: { item: Item }) {
  const rows: [string, React.ReactNode][] = item.kind === 'document' ? [
    ['Type', item.type],
    ['Status', <StatusBadge status={item.status} />],
    ['Size', fmtSize(item.size)],
    ['Version', `v${item.version}`],
    ['Created', <Who u={item.createdBy} at={item.createdAt} />],
    ['Modified', <Who u={item.modifiedBy} at={item.modifiedAt} />],
  ] : [
    ['Type', 'Folder'],
    ['Contains', `${item.itemCount} items`],
    ['Modified', <Who u={item.modifiedBy} at={item.modifiedAt} />],
  ]
  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-[12px] font-medium uppercase tracking-wider text-muted">Properties</h3>
        <button className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline"><Pencil size={13} /> Edit</button>
      </div>
      <dl className="mt-3 divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] items-center py-2.5 text-[13px]">
            <dt className="text-muted">{k}</dt><dd>{v}</dd>
          </div>
        ))}
      </dl>
      {item.kind === 'document' && (
        <div className="mt-6 grid h-44 place-items-center rounded-lg border border-line bg-mist text-[12px] text-muted">
          <div className="text-center"><ItemIcon item={item} size={28} /><div className="mt-2">Preview</div></div>
        </div>
      )}
    </section>
  )
}

const Who = ({ u, at }: { u: Item['modifiedBy']; at: string }) => (
  <span className="flex items-center gap-2"><Avatar user={u} size={20} /><span>{u.name}<span className="block text-[11.5px] text-muted">{fmtDateTime(at)}</span></span></span>
)

function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [v, setV] = useState<T | null>(null)
  useEffect(() => { setV(null); fn().then(setV) }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return v
}

function Versions({ id }: { id: string }) {
  const versions = useLoad<Version[]>(() => listVersions(id), [id])
  if (!versions) return <Loading />
  return (
    <ol className="relative space-y-1 before:absolute before:bottom-4 before:left-[11px] before:top-4 before:w-px before:bg-line">
      {versions.map((v, i) => (
        <li key={v.number} className="group relative flex gap-3 rounded-md py-2 pr-2">
          <span className={`relative z-10 mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-sm text-[10.5px] font-semibold ${i === 0 ? 'bg-navy text-paper' : 'bg-surface text-fg ring-1 ring-line'}`}>{v.number}</span>
          <div className="min-w-0 flex-1 text-[13px]">
            <div className="flex items-center gap-2 font-medium">Version {v.number}{i === 0 && <span className="rounded-sm bg-teal/12 px-1.5 text-[11px] text-teal-fg">Current</span>}</div>
            <div className="text-[12px] text-muted">{v.uploadedBy.name} · {fmtDateTime(v.uploadedAt)} · {fmtSize(v.size)}</div>
            {v.note && <div className="mt-1 text-[12px] text-fg/70">{v.note}</div>}
          </div>
          <div className="flex opacity-0 group-hover:opacity-100">
            <IconBtn icon={Download} label="Download this version" />
            {i > 0 && <IconBtn icon={RotateCcw} label="Restore this version" />}
          </div>
        </li>
      ))}
    </ol>
  )
}

const ROLES = ['Viewer', 'Contributor', 'Editor', 'Owner']

export function Access({ id }: { id: string }) {
  const grants = useLoad<AccessGrant[]>(() => listAccess(id), [id])
  if (!grants) return <Loading />
  return (
    <section>
      <div className="flex gap-2">
        <input placeholder="Add people by email" className="h-9 flex-1 rounded-md border border-line px-3 text-[13px] outline-none placeholder:text-muted focus:border-teal" />
        <select className="h-9 rounded-md border border-line bg-surface px-2 text-[13px]">{ROLES.map(r => <option key={r}>{r}</option>)}</select>
        <Button variant="primary">Share</Button>
      </div>
      <ul className="mt-5 divide-y divide-line">
        {grants.map(g => (
          <li key={g.user.id} className="flex items-center gap-3 py-3">
            <Avatar user={g.user} size={32} />
            <div className="min-w-0 flex-1 text-[13px]">
              <div className="font-medium">{g.user.name}</div>
              <div className="truncate text-[12px] text-muted">{g.inheritedFrom ? `Inherited from ${g.inheritedFrom.name}` : g.user.email}</div>
            </div>
            {g.inheritedFrom
              ? <span className="text-[12.5px] capitalize text-muted">{g.role}</span>
              : <select defaultValue={g.role} className="h-8 rounded-md bg-transparent px-1 text-[12.5px] capitalize hover:bg-mist">
                  {ROLES.map(r => <option key={r} value={r.toLowerCase()}>{r}</option>)}
                  <option value="remove">Remove access</option>
                </select>}
          </li>
        ))}
      </ul>
    </section>
  )
}

const VERBS: Record<string, string> = {
  DocumentViewed: 'viewed', DocumentUploaded: 'uploaded', VersionUploaded: 'uploaded a new version of',
  StatusChanged: 'changed the status of', AccessGranted: 'shared',
}
const verb = (a: string) => VERBS[a] ?? a

function ActivityList({ id }: { id: string }) {
  const acts = useLoad<Activity[]>(() => listActivity(id), [id])
  if (!acts) return <Loading />
  return (
    <ul className="space-y-4">
      {acts.map(a => (
        <li key={a.id} className="flex gap-3 text-[13px]">
          <Avatar user={a.user} size={28} />
          <div>
            <div><span className="font-medium">{a.user.name}</span> <span className="text-fg/70">{verb(a.action)}</span> <span className="font-medium">{a.entityName}</span></div>
            {a.details && <div className="text-[12px] text-fg/70">{a.details}</div>}
            <div className="text-[12px] text-muted">{fmtDateTime(a.at)}</div>
          </div>
        </li>
      ))}
    </ul>
  )
}

const Loading = () => <div className="space-y-3">{[60, 80, 45].map(w => <div key={w} className="h-3 animate-pulse rounded bg-mist" style={{ width: `${w}%` }} />)}</div>
