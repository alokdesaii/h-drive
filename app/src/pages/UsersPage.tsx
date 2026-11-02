import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, Download, History, Mail, MoreHorizontal, RotateCcw, Search, ShieldCheck, ShieldOff, UserPlus, UserX, X,
} from 'lucide-react'
import { DOMAIN, listMembers } from '../api'
import type { Member, MemberStatus } from '../types'
import { Avatar, Button, Dialog, Menu, MenuDivider, MenuItem, fmtDate, fmtSize, useToast } from '../ui'

const ME = 'u1' // signed-in admin (mock)
type Tab = 'all' | MemberStatus | 'admins'

const daysAgo = (iso: string) => Math.floor((Date.parse('2026-10-13T12:00:00Z') - Date.parse(iso)) / 86400000)
const ago = (iso: string) => { const n = daysAgo(iso); return n <= 0 ? 'Today' : n === 1 ? 'Yesterday' : `${n} days ago` }
const lastActive = (m: Member) => m.lastActiveAt ? ago(m.lastActiveAt) : 'Never'

export default function UsersPage() {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [tab, setTab] = useState<Tab>('all')
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [inviting, setInviting] = useState(false)
  const [deactivating, setDeactivating] = useState<Member | null>(null)
  const [toast, setToast] = useToast()
  const navigate = useNavigate()

  useEffect(() => { listMembers().then(setMembers) }, [])

  const all = members ?? []
  const admins = all.filter(m => m.isAdmin && m.status === 'active')
  const counts: Record<Tab, number> = {
    all: all.length, active: all.filter(m => m.status === 'active').length,
    invited: all.filter(m => m.status === 'invited').length, deactivated: all.filter(m => m.status === 'deactivated').length,
    admins: admins.length,
  }
  const departments = [...new Set(all.map(m => m.department))].sort()
  const maxStorage = Math.max(1, ...all.map(m => m.storageUsed))

  const rows = useMemo(() => all.filter(m =>
    (tab === 'all' || (tab === 'admins' ? m.isAdmin && m.status === 'active' : m.status === tab))
    && (!dept || m.department === dept)
    && (!q || `${m.name} ${m.email}`.toLowerCase().includes(q.toLowerCase()))
  ), [all, tab, dept, q])

  // local edits stand in for PATCH /admin/users/:id
  const update = (id: string, patch: Partial<Member>, msg: string) => {
    setMembers(ms => ms!.map(m => m.id === id ? { ...m, ...patch } : m)); setToast(msg)
  }
  const isLastAdmin = (m: Member) => m.isAdmin && admins.length <= 1

  const TABS: [Tab, string][] = [['all', 'Everyone'], ['active', 'Active'], ['invited', 'Pending invites'], ['deactivated', 'Deactivated'], ['admins', 'Admins']]

  return (
    <div className="px-8 py-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">Users</h1>
          <p className="mt-0.5 text-[13px] text-muted">People who can sign in to H Drive. Only <span className="font-medium text-fg/80">@{DOMAIN}</span> Google accounts can be invited.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* GET /admin/users/export → CSV */}
          <Button variant="secondary"><Download size={15} /> Export</Button>
          <Button variant="primary" onClick={() => setInviting(true)}><UserPlus size={15} /> Invite people</Button>
        </div>
      </div>

      {/* Status tabs double as summary counts */}
      <div className="mt-6 grid grid-cols-5 gap-3">
        {TABS.map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg border px-4 py-3 text-left transition-colors ${tab === t ? 'border-teal bg-teal text-night' : 'border-line hover:border-teal/50'}`}>
            <div className={`text-[12px] ${tab === t ? 'font-medium text-night/70' : 'text-muted'}`}>{label}</div>
            <div className="mt-1 text-[32px] font-bold leading-none tracking-tight tabular-nums">{members ? counts[t] : '–'}</div>
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or email"
            className="h-9 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-[13px] outline-none placeholder:text-muted focus:border-teal" />
        </div>
        <select value={dept} onChange={e => setDept(e.target.value)}
          className={`h-9 rounded-md border px-2.5 text-[13px] outline-none focus:border-teal ${dept ? 'border-accent/40 bg-navy/5 text-accent' : 'border-line bg-surface'}`}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
        {(q || dept) && <button onClick={() => { setQ(''); setDept('') }} className="inline-flex h-9 items-center gap-1 px-2 text-[12.5px] font-medium text-accent hover:underline"><X size={14} /> Clear</button>}
        <span className="ml-auto text-[12.5px] text-muted">{members ? `${rows.length} of ${all.length}` : ''}</span>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-line">
        <table className="w-full text-[13px]">
          <thead className="bg-navy/[0.03] text-left text-[12px] text-muted">
            <tr className="[&>th]:h-10 [&>th]:border-b [&>th]:border-line [&>th]:font-medium">
              <th className="pl-5">Person</th><th className="w-40">Department</th><th className="w-28">Role</th>
              <th className="w-44">Status</th><th className="w-32">Last active</th><th className="w-44">Storage</th><th className="w-12" />
            </tr>
          </thead>
          <tbody className="[&>tr>td]:h-14 [&>tr>td]:border-b [&>tr>td]:border-line [&>tr:last-child>td]:border-0">
            {!members ? Array.from({ length: 6 }, (_, i) => (
              <tr key={i}><td colSpan={7} className="px-5"><div className="h-3 animate-pulse rounded bg-mist" style={{ width: `${35 + (i * 17) % 40}%` }} /></td></tr>
            )) : rows.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-muted">No one matches. Try another name, department or tab.</td></tr>
            ) : rows.map(m => {
              const off = m.status === 'deactivated', stale = m.status === 'active' && m.lastActiveAt && daysAgo(m.lastActiveAt) > 30
              return (
                <tr key={m.id} className={`group hover:bg-teal/[0.04] ${off ? 'text-fg/50' : ''}`}>
                  <td className="pl-5">
                    <div className="flex items-center gap-3">
                      <span className={off ? 'opacity-50 grayscale' : ''}><Avatar user={m} size={32} /></span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-medium">{m.name}{m.id === ME && <span className="rounded-sm bg-mist px-1.5 text-[11px] font-normal text-muted">You</span>}</div>
                        <div className="truncate text-[12px] text-muted">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-fg/70">{m.department}</td>
                  <td>{m.isAdmin
                    ? <span className="inline-flex items-center gap-1 rounded-sm bg-navy/8 px-2 py-0.5 text-[11.5px] font-medium text-accent"><ShieldCheck size={12} /> Admin</span>
                    : <span className="text-fg/70">Member</span>}</td>
                  <td><Status m={m} /></td>
                  <td className={stale ? 'text-teal-fg' : 'text-fg/70'} title={m.lastActiveAt ? fmtDate(m.lastActiveAt) : 'Has not signed in yet'}>
                    {lastActive(m)}{stale && <div className="text-[11.5px]">Inactive 30+ days</div>}
                  </td>
                  <td>
                    {m.storageUsed > 0 ? (
                      <div className="pr-6" title={fmtSize(m.storageUsed)}>
                        <div className="text-[12px] tabular-nums text-fg/70">{fmtSize(m.storageUsed)}</div>
                        <div className="mt-1 h-1 rounded-[1px] bg-mist"><div className="h-1 rounded-[1px] bg-navy/60" style={{ width: `${(m.storageUsed / maxStorage) * 100}%` }} /></div>
                      </div>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td className="pr-2">
                    <Menu trigger={<button aria-label={`Actions for ${m.name}`} className="grid h-8 w-8 place-items-center rounded-md text-muted opacity-0 hover:bg-mist hover:text-fg group-hover:opacity-100 focus:opacity-100"><MoreHorizontal size={16} /></button>}>
                      {m.status === 'invited' && <>
                        <MenuItem icon={Mail} onClick={() => setToast(`Invite re-sent to ${m.email}`)}>Resend invite</MenuItem>
                        <MenuDivider />
                        <MenuItem icon={X} danger onClick={() => { setMembers(ms => ms!.filter(x => x.id !== m.id)); setToast(`Invite to ${m.email} revoked`) }}>Revoke invite</MenuItem>
                      </>}
                      {m.status === 'active' && <>
                        {m.isAdmin
                          ? <MenuItem icon={ShieldOff} hint={isLastAdmin(m) ? 'Last admin' : undefined}
                              onClick={() => isLastAdmin(m) ? setToast('H Drive needs at least one admin') : update(m.id, { isAdmin: false }, `${m.name} is now a Member`)}>Remove admin</MenuItem>
                          : <MenuItem icon={ShieldCheck} onClick={() => update(m.id, { isAdmin: true }, `${m.name} is now an Admin`)}>Make admin</MenuItem>}
                        <MenuItem icon={History} onClick={() => navigate(`/audit?user=${m.id}`)}>View activity</MenuItem>
                        <MenuDivider />
                        <MenuItem icon={UserX} danger hint={m.id === ME ? 'You' : undefined}
                          onClick={() => m.id === ME ? setToast('You can’t deactivate yourself') : isLastAdmin(m) ? setToast('H Drive needs at least one admin') : setDeactivating(m)}>Deactivate</MenuItem>
                      </>}
                      {off && <MenuItem icon={RotateCcw} onClick={() => update(m.id, { status: 'active' }, `${m.name} can sign in again`)}>Reactivate</MenuItem>}
                    </Menu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <InviteDialog open={inviting} onClose={() => setInviting(false)} existing={all} departments={departments}
        onInvite={(emails, isAdmin, department) => {
          const now = new Date('2026-10-13T12:00:00Z').toISOString()
          setMembers(ms => [...emails.map((email, i) => ({
            id: `new${Date.now()}${i}`, email, isAdmin, department: department || '—', status: 'invited' as const,
            name: email.split('@')[0].split(/[._-]/).map(p => p[0]?.toUpperCase() + p.slice(1)).join(' '),
            lastActiveAt: null, invitedAt: now, invitedBy: 'Alok Desai', storageUsed: 0,
          })), ...ms!])
          setInviting(false); setTab('invited')
          setToast(`${emails.length} invite${emails.length > 1 ? 's' : ''} sent`)
        }} />

      <DeactivateDialog member={deactivating} candidates={all.filter(x => x.status === 'active' && x.id !== deactivating?.id)}
        onClose={() => setDeactivating(null)}
        onConfirm={(to) => { const m = deactivating!; setDeactivating(null); update(m.id, { status: 'deactivated' }, `${m.name} deactivated · files moved to ${to}`) }} />

      {toast}
    </div>
  )
}

function Status({ m }: { m: Member }) {
  if (m.status === 'invited') return (
    <div><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Invite sent</span>
      <div className="text-[11.5px] text-muted">{ago(m.invitedAt)} · by {m.invitedBy?.split(' ')[0]}</div></div>
  )
  if (m.status === 'deactivated') return <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-muted" />Deactivated</span>
  return <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-teal" />Active</span>
}

/** Invite: email chips, @domain enforced, duplicates and existing members caught before sending. */
function InviteDialog({ open, onClose, existing, departments, onInvite }: {
  open: boolean; onClose: () => void; existing: Member[]; departments: string[]
  onInvite: (emails: string[], isAdmin: boolean, department: string) => void
}) {
  const [emails, setEmails] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [department, setDepartment] = useState('')
  useEffect(() => { if (open) { setEmails([]); setDraft(''); setIsAdmin(false); setDepartment('') } }, [open])

  const problem = (e: string) =>
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? 'Not a valid email'
    : !e.endsWith(`@${DOMAIN}`) ? `Must be an @${DOMAIN} address`
    : existing.some(m => m.email === e) ? 'Already in H Drive' : null
  const add = (raw: string) => {
    const next = raw.split(/[\s,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean)
    if (next.length) setEmails(es => [...new Set([...es, ...next])])
    setDraft('')
  }
  const errors = emails.map(problem).filter(Boolean)
  const valid = emails.length > 0 && errors.length === 0

  return (
    <Dialog open={open} onClose={onClose} width={520} title="Invite people"
      description="They'll get an email and sign in with their Harbour & Hills Google account."
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!valid} onClick={() => onInvite(emails, isAdmin, department)}>
          <Mail size={15} /> Send {emails.length > 1 ? `${emails.length} invites` : 'invite'}
        </Button>
      </>}>
      <label className="text-[12.5px] font-medium">Email addresses</label>
      <div className="mt-1.5 flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-md border border-line p-1.5 focus-within:border-teal"
        onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
        {emails.map(e => {
          const err = problem(e)
          return (
            <span key={e} title={err ?? undefined}
              className={`inline-flex h-7 items-center gap-1 rounded-sm pl-2 pr-1 text-[12.5px] ${err ? 'bg-red-500/10 text-red-600 ring-1 ring-red-500/30' : 'bg-teal/12 text-teal-fg'}`}>
              {e}
              <button onClick={() => setEmails(es => es.filter(x => x !== e))} aria-label={`Remove ${e}`} className="grid h-5 w-5 place-items-center rounded-sm hover:bg-fg/10"><X size={12} /></button>
            </span>
          )
        })}
        <input value={draft} autoFocus
          onChange={e => /[\s,;]$/.test(e.target.value) ? add(e.target.value) : setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && draft) { e.preventDefault(); add(draft) }
            if (e.key === 'Backspace' && !draft) setEmails(es => es.slice(0, -1))
          }}
          onBlur={() => draft && add(draft)}
          onPaste={e => { e.preventDefault(); add(draft + ' ' + e.clipboardData.getData('text')) }}
          placeholder={emails.length ? '' : `name@${DOMAIN}`}
          className="h-7 min-w-40 flex-1 bg-transparent px-1.5 text-[13px] outline-none placeholder:text-muted" />
      </div>
      <p className={`mt-1.5 text-[12px] ${errors.length ? 'text-red-600' : 'text-muted'}`}>
        {errors.length ? `${errors.length} address${errors.length > 1 ? 'es need' : ' needs'} fixing: ${errors[0]}` : 'Press Enter or comma to add. You can paste a list.'}
      </p>

      <fieldset className="mt-5">
        <legend className="text-[12.5px] font-medium">Role</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {([[false, 'Member', 'Sees what’s shared with them'], [true, 'Admin', 'Manages users, access and settings']] as const).map(([v, t, d]) => (
            <label key={t} className={`cursor-pointer rounded-md border p-3 ${isAdmin === v ? 'border-teal bg-teal/[0.06]' : 'border-line hover:border-accent/30'}`}>
              <input type="radio" name="role" className="sr-only" checked={isAdmin === v} onChange={() => setIsAdmin(v)} />
              <div className="flex items-center justify-between text-[13px] font-medium">{t}{isAdmin === v && <Check size={14} className="text-teal" />}</div>
              <div className="mt-0.5 text-[12px] text-muted">{d}</div>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 block text-[12.5px] font-medium">Department <span className="font-normal text-muted">(optional)</span></label>
      <select value={department} onChange={e => setDepartment(e.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface px-2.5 text-[13px] outline-none focus:border-teal">
        <option value="">Choose later</option>
        {departments.map(d => <option key={d}>{d}</option>)}
      </select>
    </Dialog>
  )
}

/** Deactivate: explains the consequence and asks who takes over their files. */
function DeactivateDialog({ member, candidates, onClose, onConfirm }: {
  member: Member | null; candidates: Member[]; onClose: () => void; onConfirm: (newOwner: string) => void
}) {
  const [to, setTo] = useState('')
  useEffect(() => { setTo(candidates.find(c => c.isAdmin)?.name ?? candidates[0]?.name ?? '') }, [member]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Dialog open={!!member} onClose={onClose} title={`Deactivate ${member?.name ?? ''}?`}
      footer={<>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button className="bg-red-600 text-paper hover:bg-red-700" onClick={() => onConfirm(to)}><UserX size={15} /> Deactivate</Button>
      </>}>
      <ul className="space-y-2 text-[13px] text-fg/80">
        <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />They’re signed out and can’t sign in to H Drive.</li>
        <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />Their access to folders is kept, so reactivating restores it.</li>
        <li className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />Nothing is deleted. You can reactivate them any time.</li>
      </ul>
      {member && member.storageUsed > 0 && (
        <div className="mt-5">
          <label className="text-[12.5px] font-medium">Move their files ({fmtSize(member.storageUsed)}) to</label>
          <select value={to} onChange={e => setTo(e.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface px-2.5 text-[13px] outline-none focus:border-teal">
            {candidates.map(c => <option key={c.id}>{c.name}</option>)}
          </select>
          <p className="mt-1.5 text-[12px] text-muted">They become the Owner of everything {member.name.split(' ')[0]} owned.</p>
        </div>
      )}
    </Dialog>
  )
}
