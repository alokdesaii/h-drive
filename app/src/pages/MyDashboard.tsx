// Dashboard for regular staff (non-admins): their own work, not workspace stats.
// Backend: GET /me/home → { recent, sharedWithMe, toReview, alerts }
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Bell, Check, Clock, FileUp, FolderOpen, Search, Users, X } from 'lucide-react'
import { TYPE_COLORS, UNREAD_COUNT } from '../api'
import { items, notifications } from '../mock'
import type { Document } from '../types'
import { useMe } from '../session'
import { Avatar, ItemIcon, StatusBadge, fmtDate, fmtSize, useToast } from '../ui'

export default function MyDashboard() {
  const me = useMe()
  const docs = items.filter((i): i is Document => i.kind === 'document')
  const recent = docs.filter(d => d.modifiedBy.id === me.id || d.createdBy.id === me.id).sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt)).slice(0, 4)
  const shared = docs.filter(d => d.createdBy.id !== me.id).sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt)).slice(0, 5)
  const [review, setReview] = useState(docs.filter(d => d.status === 'in_review' && d.modifiedBy.id !== me.id)) // never your own work
  const [toast, showToast] = useToast()
  const href = (d: Document) => `/documents/${d.folderId ?? ''}?item=${d.id}`

  return (
    <div className="min-h-full bg-canvas px-8 py-7">
      {/* Greeting banner */}
      <header className="brand-banner relative overflow-hidden rounded-lg px-7 py-7 text-paper">
        <div className="relative flex items-center gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-teal">Good morning</p>
            <h1 className="mt-1 text-[26px] font-semibold tracking-tight">{me.name.split(' ')[0]}, here’s your day in H Drive</h1>
            <div className="mt-5 flex gap-2">
              <Link to="/documents" className="inline-flex h-10 items-center gap-2 rounded-md bg-teal px-4 text-[13px] font-medium text-night hover:brightness-95"><FileUp size={15} /> Upload files</Link>
              <Link to="/search" className="inline-flex h-10 items-center gap-2 rounded-md px-4 text-[13px] font-medium text-paper/85 ring-1 ring-paper/20 hover:bg-paper/10"><Search size={15} /> Find a file</Link>
            </div>
          </div>
          {[[review.length, 'to review', '/search?status=in_review'], [UNREAD_COUNT, 'new alerts', '/alerts'], [shared.length, 'shared with you', '/documents']].map(([v, l, to]) => (
            <Link key={l} to={to as string} className="group shrink-0 border-l border-paper/15 pl-6 text-right">
              <div className="text-[34px] font-bold leading-none tabular-nums">{v}</div>
              <div className="mt-1.5 flex items-center justify-end gap-1 text-[12px] text-teal">{l}<ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" /></div>
            </Link>
          ))}
        </div>
      </header>

      {/* Recent files */}
      <section className="mt-6">
        <Head icon={Clock} title="Pick up where you left off" to="/documents" />
        <div className="mt-3 grid grid-cols-4 gap-4">
          {recent.map(d => (
            <Link key={d.id} to={href(d)} className="group relative overflow-hidden rounded-lg bg-surface p-4 shadow-[0_1px_2px_rgba(2,6,23,0.04)] transition-shadow hover:shadow-md">
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: TYPE_COLORS[d.type] }} />
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-mist"><ItemIcon item={d} size={19} /></span>
                <StatusBadge status={d.status} />
              </div>
              <div className="mt-4 truncate text-[13.5px] font-semibold group-hover:text-accent">{d.name}</div>
              <div className="mt-0.5 text-[12px] text-muted">Edited {fmtDate(d.modifiedAt)} · {fmtSize(d.size)}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-[1.25fr_1fr] gap-6">
        {/* Waiting for my review */}
        <section className="rounded-lg bg-surface shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
          <div className="px-5 pt-5"><Head icon={Check} title="Waiting for your review" count={review.length} /></div>
          {review.length === 0 ? (
            <div className="px-5 pb-8 pt-6 text-center text-[13px] text-muted"><Check size={20} className="mx-auto mb-2 text-teal" />Nothing waiting. Nice.</div>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {review.map(d => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                  <ItemIcon item={d} size={17} />
                  <Link to={href(d)} className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium hover:text-accent">{d.name}</div>
                    <div className="text-[11.5px] text-muted">From {d.modifiedBy.name} · {fmtDate(d.modifiedAt)}</div>
                  </Link>
                  {/* Backend: POST /documents/:id/review { decision: 'approve' | 'changes' } */}
                  <button onClick={() => { setReview(r => r.filter(x => x.id !== d.id)); showToast(`${d.name} approved`) }} aria-label={`Approve ${d.name}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-teal px-2.5 text-[12px] font-medium text-night hover:brightness-95"><Check size={13} /> Approve</button>
                  <button onClick={() => { setReview(r => r.filter(x => x.id !== d.id)); showToast(`Changes requested on ${d.name}`) }} aria-label={`Request changes on ${d.name}`} title="Request changes"
                    className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted hover:border-red-500/40 hover:text-red-600"><X size={14} /></button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Shared with me */}
        <section className="rounded-lg bg-surface shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
          <div className="px-5 pt-5"><Head icon={Users} title="Shared with you" to="/documents" /></div>
          <ul className="mt-3 divide-y divide-line">
            {shared.map(d => (
              <li key={d.id}>
                <Link to={href(d)} className="flex items-center gap-3 px-5 py-3 hover:bg-teal/[0.04]">
                  <Avatar user={d.createdBy} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{d.name}</div>
                    <div className="text-[11.5px] text-muted">{d.createdBy.name.split(' ')[0]} · {fmtDate(d.modifiedAt)}</div>
                  </div>
                  <span className="h-2 w-2 rounded-sm" style={{ background: TYPE_COLORS[d.type] }} title={d.type} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Alerts strip */}
      <section className="mt-6 rounded-lg bg-surface p-5 shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
        <Head icon={Bell} title="Latest alerts" to="/alerts" />
        <ul className="mt-3 grid grid-cols-3 gap-3">
          {notifications.slice(0, 3).map(n => (
            <li key={n.id} className={`rounded-md p-3 text-[12.5px] ${n.read ? 'bg-mist' : 'bg-teal/10'}`}>
              <div className="flex items-center gap-2"><Avatar user={n.actor} size={20} /><span className="font-medium">{n.actor.name.split(' ')[0]}</span><span className="ml-auto text-[11px] text-muted">{n.detail}</span></div>
              <div className="mt-1.5 truncate text-fg/80"><FolderOpen size={12} className="mr-1 inline text-muted" />{n.target.name}</div>
            </li>
          ))}
        </ul>
      </section>
      {toast}
    </div>
  )
}

function Head({ icon: Icon, title, to, count }: { icon: typeof Bell; title: string; to?: string; count?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-teal/15 text-teal-fg"><Icon size={15} /></span>
      <h2 className="text-[14.5px] font-semibold">{title}</h2>
      {count !== undefined && <span className="rounded-sm bg-mist px-1.5 text-[11.5px] font-medium tabular-nums">{count}</span>}
      {to && <Link to={to} className="ml-auto flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline">View all <ArrowRight size={12} /></Link>}
    </div>
  )
}
