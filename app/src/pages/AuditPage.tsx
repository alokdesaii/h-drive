import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, FileText, Folder, Search, User as UserIcon, X } from 'lucide-react'
import { AUDIT_ACTIONS, listAudit, users, type AuditQuery } from '../api'
import type { Activity } from '../types'
import { Avatar, Button, fmtDateTime } from '../ui'

const PAGE_SIZE = 15
const label = (a: string) => a.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ (\w)/g, (_, c) => ' ' + c.toLowerCase())

// colour by consequence: neutral reads, teal creates, navy access/admin, red destructive
const tone = (a: string) =>
  /Trashed|Revoked|Deleted/.test(a) ? 'bg-red-500'
  : /Access|User/.test(a) ? 'bg-navy'
  : /Uploaded|Created|Changed/.test(a) ? 'bg-teal'
  : 'bg-muted'

const ENTITY_ICON = { document: FileText, folder: Folder, user: UserIcon }

export default function AuditPage() {
  const [f, setF] = useState<Omit<AuditQuery, 'page' | 'pageSize'>>({})
  const [page, setPage] = useState(0)
  const [data, setData] = useState<{ total: number; rows: Activity[] } | null>(null)

  useEffect(() => { setData(null); listAudit({ ...f, page, pageSize: PAGE_SIZE }).then(setData) }, [f, page])
  const set = (k: keyof typeof f, v: string) => { setPage(0); setF(p => ({ ...p, [k]: v || undefined })) }
  const active = Object.values(f).some(Boolean)
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div className="px-8 py-7">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Audit log</h1>
          <p className="mt-0.5 text-[13px] text-muted">Every action taken in H Drive. Entries can't be edited or deleted.</p>
        </div>
        {/* GET /audit/export?<same filters> → CSV */}
        <Button variant="secondary"><Download size={15} /> Export CSV</Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={f.q ?? ''} onChange={e => set('q', e.target.value)} placeholder="Search file, folder or details"
            className="h-9 w-full rounded-md border border-line pl-9 pr-3 text-[13px] outline-none placeholder:text-muted focus:border-teal" />
        </div>
        <Select value={f.action} onChange={v => set('action', v)} placeholder="All actions" options={AUDIT_ACTIONS.map(a => [a, label(a)])} />
        <Select value={f.entity} onChange={v => set('entity', v)} placeholder="All items" options={[['document', 'Documents'], ['folder', 'Folders'], ['user', 'Users']]} />
        <Select value={f.userId} onChange={v => set('userId', v)} placeholder="Anyone" options={users.map(u => [u.id, u.name])} />
        {active && <button onClick={() => { setF({}); setPage(0) }} className="inline-flex h-9 items-center gap-1 px-2 text-[12.5px] font-medium text-navy hover:underline"><X size={14} /> Clear filters</button>}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        <table className="w-full text-[13px]">
          <thead className="bg-navy/[0.03] text-left text-[12px] text-muted">
            <tr className="[&>th]:h-10 [&>th]:border-b [&>th]:border-line [&>th]:font-medium">
              <th className="w-48 pl-5">When</th><th className="w-52">Who</th><th className="w-56">Action</th><th>Item</th><th className="pr-5">Details</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:h-12 [&>tr>td]:border-b [&>tr>td]:border-line [&>tr:last-child>td]:border-0">
            {!data ? Array.from({ length: 8 }, (_, i) => (
              <tr key={i}><td colSpan={5} className="px-5"><div className="h-3 animate-pulse rounded bg-mist" style={{ width: `${40 + (i * 17) % 40}%` }} /></td></tr>
            )) : data.rows.length === 0 ? (
              <tr><td colSpan={5} className="py-16 text-center text-muted">No entries match these filters.</td></tr>
            ) : data.rows.map(a => {
              const Icon = ENTITY_ICON[a.entity]
              return (
                <tr key={a.id} className="hover:bg-teal/[0.04]">
                  <td className="pl-5 tabular-nums text-ink/70">{fmtDateTime(a.at)}</td>
                  <td><span className="flex items-center gap-2"><Avatar user={a.user} size={24} />{a.user.name}</span></td>
                  <td><span className="inline-flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${tone(a.action)}`} />{label(a.action)}</span></td>
                  <td><span className="flex items-center gap-2"><Icon size={15} strokeWidth={1.75} className="shrink-0 text-navy/70" /><span className="truncate">{a.entityName}</span></span></td>
                  <td className="pr-5 text-ink/70">{a.details ?? <span className="text-muted">—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-[12.5px] text-muted">
        <span>{data ? `${data.total ? page * PAGE_SIZE + 1 : 0}–${Math.min((page + 1) * PAGE_SIZE, data.total)} of ${data.total}` : ' '}</span>
        <div className="flex items-center gap-1">
          <span className="mr-2">Page {page + 1} of {pages}</span>
          <PageBtn disabled={page === 0} onClick={() => setPage(p => p - 1)} label="Previous page"><ChevronLeft size={15} /></PageBtn>
          <PageBtn disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} label="Next page"><ChevronRight size={15} /></PageBtn>
        </div>
      </div>
    </div>
  )
}

function Select({ value, onChange, placeholder, options }: { value?: string; onChange: (v: string) => void; placeholder: string; options: string[][] }) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value)}
      className={`h-9 rounded-md border px-2.5 text-[13px] outline-none focus:border-teal ${value ? 'border-navy/40 bg-navy/5 text-navy' : 'border-line bg-paper'}`}>
      <option value="">{placeholder}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

const PageBtn = ({ disabled, onClick, label, children }: { disabled: boolean; onClick: () => void; label: string; children: React.ReactNode }) => (
  <button disabled={disabled} onClick={onClick} aria-label={label}
    className="grid h-8 w-8 place-items-center rounded-md border border-line text-ink hover:border-navy/40 hover:text-navy disabled:opacity-40">{children}</button>
)
