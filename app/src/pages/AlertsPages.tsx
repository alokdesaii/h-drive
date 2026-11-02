import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell, BellOff, BellRing, CheckCheck, ChevronRight, Circle, FilePen, FileUp, GitPullRequestArrow, Mail, Plus, Settings2, Share2, Trash2,
} from 'lucide-react'
import { getAlertPrefs, listFolders, listNotifications, listSubscriptions } from '../api'
import type { AlertEvent, AlertPrefs, Notification, Subscription } from '../types'
import { Avatar, Button, Dialog, ItemIcon, useToast } from '../ui'

const NOW = Date.parse('2026-10-13T12:00:00Z')
const ME = 'u1' // signed-in user (mock)

// One look per event type; used by the feed and by the toggles on Manage alerts.
export const EVENTS: Record<AlertEvent, { label: string; verb: string; icon: typeof Bell; chip: string }> = {
  uploaded: { label: 'Uploads', verb: 'uploaded', icon: FileUp, chip: 'bg-teal/15 text-teal-fg' },
  changed: { label: 'Edits', verb: 'edited', icon: FilePen, chip: 'bg-mist text-fg/70' },
  status: { label: 'Status changes', verb: 'changed the status of', icon: GitPullRequestArrow, chip: 'bg-navy/10 text-accent' },
  shared: { label: 'Sharing', verb: 'shared', icon: Share2, chip: 'bg-indigo-500/12 text-indigo-600' },
  deleted: { label: 'Deletions', verb: 'deleted', icon: Trash2, chip: 'bg-red-500/10 text-red-600' },
}
const EVENT_KEYS = Object.keys(EVENTS) as AlertEvent[]

const ago = (iso: string) => {
  const h = Math.floor((NOW - Date.parse(iso)) / 3600000)
  return h < 1 ? 'Just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}
const bucket = (iso: string) => {
  const d = Math.floor((NOW - Date.parse(iso)) / 86400000)
  return d < 1 ? 'Today' : d < 2 ? 'Yesterday' : d < 7 ? 'Earlier this week' : 'Older'
}
const hrefFor = (t: Notification['target']) => t.kind === 'folder' ? `/documents/${t.id}` : `/documents/${t.folderId ?? ''}?item=${t.id}`

/* ───────────────────────────── Alerts feed ───────────────────────────── */

export function AlertsPage() {
  const [items, setItems] = useState<Notification[] | null>(null)
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  const [kind, setKind] = useState<AlertEvent | ''>('')
  const [toast, showToast] = useToast()
  const navigate = useNavigate()

  useEffect(() => { listNotifications().then(setItems) }, [])
  const all = items ?? []
  const unread = all.filter(n => !n.read).length
  const thisWeek = all.filter(n => NOW - Date.parse(n.at) < 7 * 86400000).length
  const shown = useMemo(() => all.filter(n => (tab === 'all' || !n.read) && (!kind || n.event === kind)), [all, tab, kind])
  const groups = useMemo(() => {
    const g = new Map<string, Notification[]>()
    shown.forEach(n => { const b = bucket(n.at); g.set(b, [...(g.get(b) ?? []), n]) })
    return [...g]
  }, [shown])

  const setRead = (ids: string[], read: boolean) => setItems(xs => xs!.map(n => ids.includes(n.id) ? { ...n, read } : n))

  return (
    <div className="min-h-full bg-canvas px-8 py-7">
      <header className="brand-banner relative overflow-hidden rounded-lg px-6 py-6 text-paper">
        <div className="relative flex items-center gap-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-teal text-night"><Bell size={22} strokeWidth={1.75} /></span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-semibold tracking-tight">Alerts</h1>
            <p className="mt-0.5 text-[13px] text-paper/65">Updates on the files and folders you follow.</p>
          </div>
          <Stat value={items ? unread : '–'} label="unread" hot={unread > 0} />
          <Stat value={items ? thisWeek : '–'} label="this week" />
          <div className="ml-1 flex flex-col gap-2">
            <Button disabled={!unread} onClick={() => { setRead(all.map(n => n.id), true); showToast('All alerts marked as read') }} className="bg-teal text-night hover:brightness-95"><CheckCheck size={15} /> Mark all read</Button>
            <Link to="/alerts/manage" className="inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-[13px] font-medium text-paper/80 ring-1 ring-paper/20 hover:bg-paper/10"><Settings2 size={15} /> Manage alerts</Link>
          </div>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md bg-surface p-1 shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
          {([['all', 'All', all.length], ['unread', 'Unread', unread]] as const).map(([t, l, c]) => (
            <button key={t} onClick={() => setTab(t)} className={`flex h-8 items-center gap-2 rounded-sm px-3.5 text-[13px] font-medium ${tab === t ? 'bg-teal text-night' : 'text-fg/60 hover:text-fg'}`}>
              {l}<span className={`rounded-sm px-1.5 text-[11px] tabular-nums ${tab === t ? 'bg-night/15' : 'bg-mist'}`}>{c}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EVENT_KEYS.map(k => {
            const E = EVENTS[k], on = kind === k
            return (
              <button key={k} onClick={() => setKind(on ? '' : k)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] font-medium transition-colors ${on ? 'border-teal bg-teal/10 text-teal-fg' : 'border-line bg-surface text-fg/70 hover:border-teal/40'}`}>
                <E.icon size={13} /> {E.label}
              </button>
            )
          })}
        </div>
      </div>

      <section className="mt-4 overflow-hidden rounded-lg bg-surface shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
        {!items ? (
          <div className="space-y-5 p-6">{[70, 50, 80].map(w => <div key={w} className="h-3 animate-pulse rounded bg-mist" style={{ width: `${w}%` }} />)}</div>
        ) : shown.length === 0 ? (
          <div className="grid place-items-center py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-md bg-teal/12 text-teal-fg"><CheckCheck size={24} /></span>
            <div className="mt-4 text-[15px] font-medium">{tab === 'unread' ? 'You’re all caught up' : 'No alerts yet'}</div>
            <p className="mt-1 max-w-sm text-[13px] text-muted">{tab === 'unread' ? 'Nothing new since you last checked.' : 'Use “Alert me” on a file or folder to follow it.'}</p>
          </div>
        ) : groups.map(([label, list]) => (
          <div key={label}>
            <div className="sticky top-0 z-10 border-b border-line bg-mist/80 px-6 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted backdrop-blur">{label}</div>
            <ul className="divide-y divide-line">
              {list.map(n => {
                const E = EVENTS[n.event]
                return (
                  <li key={n.id} className={`group relative flex items-start gap-4 px-6 py-4 ${n.read ? '' : 'bg-teal/[0.04]'}`}>
                    {!n.read && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-teal" />}
                    <span className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-md ${E.chip}`}><E.icon size={18} strokeWidth={1.75} /></span>
                    <button onClick={() => { setRead([n.id], true); navigate(hrefFor(n.target)) }} className="min-w-0 flex-1 text-left">
                      <div className="text-[13.5px] leading-snug">
                        <span className="mr-1 inline-block translate-y-[3px]"><Avatar user={n.actor} size={18} /></span>
                        <span className="font-semibold">{n.actor.id === ME ? 'You' : n.actor.name}</span> <span className="text-fg/70">{E.verb}</span>{' '}
                        <span className="font-semibold hover:text-accent">{n.target.name}</span>
                      </div>
                      {n.detail && <div className="mt-1 inline-flex items-center gap-1.5 rounded-sm bg-mist px-2 py-0.5 text-[12px] text-fg/75"><ItemIcon item={{ kind: n.target.kind, name: n.target.name } as never} size={12} />{n.detail}</div>}
                      <div className="mt-1.5 flex items-center gap-1 text-[12px] text-muted">
                        {['Documents', ...n.target.path].map((p, i, a) => <span key={i} className="flex items-center gap-1">{p}{i < a.length - 1 && <ChevronRight size={10} />}</span>)}
                        <span className="mx-1">·</span>
                        <BellRing size={11} /> because you follow {n.because}
                      </div>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className={`text-[12px] tabular-nums ${n.read ? 'text-muted' : 'font-semibold text-teal-fg'}`}>{ago(n.at)}</span>
                      <button onClick={() => setRead([n.id], !n.read)} title={n.read ? 'Mark as unread' : 'Mark as read'} aria-label={n.read ? 'Mark as unread' : 'Mark as read'}
                        className="grid h-7 w-7 place-items-center rounded-md text-muted opacity-0 hover:bg-mist hover:text-fg focus:opacity-100 group-hover:opacity-100">
                        {n.read ? <Circle size={12} /> : <CheckCheck size={14} />}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>
      {toast}
    </div>
  )
}

/* ─────────────────────────── Manage alerts ─────────────────────────── */

const EMAIL_MODES: [AlertPrefs['emailMode'], string, string][] = [
  ['instant', 'Instantly', 'An email for every alert'], ['daily', 'Daily summary', 'One email each morning'],
  ['weekly', 'Weekly summary', 'One email on Mondays'], ['off', 'Off', 'In H Drive only'],
]

export function ManageAlertsPage() {
  const [subs, setSubs] = useState<Subscription[] | null>(null)
  const [prefs, setPrefs] = useState<AlertPrefs | null>(null)
  const [adding, setAdding] = useState(false)
  const [toast, showToast] = useToast()

  useEffect(() => { listSubscriptions().then(setSubs); getAlertPrefs().then(setPrefs) }, [])
  const patch = (id: string, p: Partial<Subscription>) => setSubs(ss => ss!.map(s => s.id === id ? { ...s, ...p } : s))
  const folders = (subs ?? []).filter(s => s.target.kind === 'folder').length

  return (
    <div className="min-h-full bg-canvas px-8 py-7">
      <header className="brand-banner relative overflow-hidden rounded-lg px-6 py-6 text-paper">
        <div className="relative flex items-center gap-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-teal text-night"><BellRing size={22} strokeWidth={1.75} /></span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] font-semibold tracking-tight">Manage alerts</h1>
            <p className="mt-0.5 text-[13px] text-paper/65">Choose what you follow and how you hear about it. These settings are just for you.</p>
          </div>
          <Stat value={subs ? subs.length : '–'} label="following" />
          <Stat value={subs ? folders : '–'} label={folders === 1 ? 'folder' : 'folders'} />
          <Button onClick={() => setAdding(true)} className="ml-1 bg-teal text-night hover:brightness-95"><Plus size={15} /> Follow a folder</Button>
        </div>
      </header>

      {/* Delivery */}
      <section className="mt-5 rounded-lg bg-surface p-6 shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="flex items-center gap-2 text-[15px] font-semibold"><Mail size={16} className="text-teal-fg" /> Email</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">Alerts always appear here in H Drive. Choose if and when you also get them by email.</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {EMAIL_MODES.map(([v, l, d]) => {
            const on = prefs?.emailMode === v
            return (
              <button key={v} onClick={() => { setPrefs({ emailMode: v }); showToast(`Email alerts: ${l}`) }}
                className={`rounded-md border-2 p-4 text-left transition-colors ${on ? 'border-teal bg-teal/[0.07]' : 'border-line hover:border-teal/40'}`}>
                <div className="flex items-center justify-between text-[13.5px] font-semibold">{l}<span className={`grid h-4 w-4 place-items-center rounded-full border-2 ${on ? 'border-teal' : 'border-line'}`}>{on && <span className="h-2 w-2 rounded-full bg-teal" />}</span></div>
                <div className="mt-1 text-[12px] text-muted">{d}</div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Following */}
      <section className="mt-5 overflow-hidden rounded-lg bg-surface shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
        <header className="flex items-end justify-between border-b border-line px-6 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Following</h2>
            <p className="mt-0.5 text-[12.5px] text-muted">Following a folder includes everything inside it. Tap an event to turn it on or off.</p>
          </div>
        </header>
        {!subs ? (
          <div className="space-y-4 p-6">{[60, 45, 70].map(w => <div key={w} className="h-3 animate-pulse rounded bg-mist" style={{ width: `${w}%` }} />)}</div>
        ) : subs.length === 0 ? (
          <div className="grid place-items-center py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-md bg-teal/12 text-teal-fg"><BellOff size={22} /></span>
            <div className="mt-4 text-[15px] font-medium">You’re not following anything</div>
            <p className="mt-1 text-[13px] text-muted">Follow a folder, or use “Alert me” on any file.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {subs.map(s => {
              const count = EVENT_KEYS.filter(k => s.events[k]).length
              return (
                <li key={s.id} className="flex items-center gap-5 px-6 py-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-mist"><ItemIcon item={{ kind: s.target.kind, name: s.target.name } as never} size={19} /></span>
                  <div className="w-64 min-w-0 shrink-0">
                    <div className="truncate text-[13.5px] font-semibold">{s.target.name}</div>
                    <div className="truncate text-[12px] text-muted">{['Documents', ...s.target.path].join(' / ')}</div>
                    <div className={`text-[11.5px] font-medium ${count === 5 ? 'text-teal-fg' : 'text-fg/60'}`}>{count === 5 ? 'All events' : `${count} of 5 events`}</div>
                  </div>
                  <div className="flex flex-1 flex-wrap gap-1.5">
                    {EVENT_KEYS.map(k => {
                      const E = EVENTS[k], on = s.events[k]
                      return (
                        <button key={k} role="switch" aria-checked={on} aria-label={`${E.label} for ${s.target.name}`}
                          onClick={() => patch(s.id, { events: { ...s.events, [k]: !on } })}
                          className={`inline-flex h-7 items-center gap-1.5 rounded-sm px-2 text-[12px] font-medium transition-colors ${on ? 'bg-teal/15 text-teal-fg' : 'bg-transparent text-muted line-through decoration-muted/50 ring-1 ring-line hover:text-fg'}`}>
                          <E.icon size={12} />{E.label}
                        </button>
                      )
                    })}
                  </div>
                  <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[12.5px] text-fg/70" title={prefs?.emailMode === 'off' ? 'Email is off for all alerts' : undefined}>
                    <input type="checkbox" checked={s.email && prefs?.emailMode !== 'off'} disabled={prefs?.emailMode === 'off'} onChange={e => patch(s.id, { email: e.target.checked })} className="h-4 w-4 accent-teal" />
                    <Mail size={13} /> Email
                  </label>
                  <button onClick={() => { setSubs(ss => ss!.filter(x => x.id !== s.id)); showToast(`Stopped following ${s.target.name}`) }}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-line px-2.5 text-[12.5px] font-medium text-fg/70 hover:border-red-500/40 hover:text-red-600">
                    <BellOff size={13} /> Unfollow
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <FollowDialog open={adding} following={(subs ?? []).map(s => s.target.id)} onClose={() => setAdding(false)} onFollow={(id, events) => {
        const f = listFolders().find(x => x.id === id)!
        const path: string[] = []; let p = listFolders().find(x => x.id === f.parentId)
        while (p) { path.unshift(p.name); p = listFolders().find(x => x.id === p!.parentId) }
        setSubs(ss => [{ id: `s${Date.now()}`, target: { id, name: f.name, kind: 'folder', path }, events, email: true }, ...ss!])
        setAdding(false); showToast(`Following ${f.name}`)
      }} />
      {toast}
    </div>
  )
}

function FollowDialog({ open, following, onClose, onFollow }: { open: boolean; following: string[]; onClose: () => void; onFollow: (id: string, events: Record<AlertEvent, boolean>) => void }) {
  const options = listFolders().filter(f => !following.includes(f.id))
  const [id, setId] = useState('')
  const [events, setEvents] = useState<Record<AlertEvent, boolean>>({ uploaded: true, changed: true, status: true, shared: true, deleted: true })
  useEffect(() => { if (open) { setId(options[0]?.id ?? ''); setEvents({ uploaded: true, changed: true, status: true, shared: true, deleted: true }) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Dialog open={open} onClose={onClose} title="Follow a folder" description="Get alerts about everything inside it, including subfolders."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!id || !Object.values(events).some(Boolean)} onClick={() => onFollow(id, events)}><BellRing size={15} /> Follow</Button></>}>
      {options.length === 0 ? <p className="text-[13px] text-muted">You already follow every folder.</p> : <>
        <label className="text-[12.5px] font-medium">Folder</label>
        <select value={id} onChange={e => setId(e.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface px-2.5 text-[13px] outline-none focus:border-teal">
          {options.map(f => <option key={f.id} value={f.id}>{f.parentId ? `— ${f.name}` : f.name}</option>)}
        </select>
        <div className="mt-5 text-[12.5px] font-medium">Tell me about</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {EVENT_KEYS.map(k => {
            const E = EVENTS[k]
            return (
              <label key={k} className={`flex cursor-pointer items-center gap-2.5 rounded-md border p-2.5 text-[13px] ${events[k] ? 'border-teal/50 bg-teal/[0.06]' : 'border-line'}`}>
                <input type="checkbox" checked={events[k]} onChange={e => setEvents({ ...events, [k]: e.target.checked })} className="h-4 w-4 accent-teal" />
                <span className={`grid h-6 w-6 place-items-center rounded-sm ${E.chip}`}><E.icon size={12} /></span>{E.label}
              </label>
            )
          })}
        </div>
      </>}
    </Dialog>
  )
}

function Stat({ value, label, hot }: { value: string | number; label: string; hot?: boolean }) {
  return (
    <div className="shrink-0 border-l border-paper/15 pl-5 text-right">
      <div className={`text-[28px] font-bold leading-none tabular-nums ${hot ? 'text-teal' : ''}`}>{value}</div>
      <div className="mt-1.5 text-[11.5px] text-paper/60">{label}</div>
    </div>
  )
}
