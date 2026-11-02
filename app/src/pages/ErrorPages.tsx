import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Check, Compass, Lock, Search, Send, ShieldX } from 'lucide-react'
import { folderPath, users } from '../api'
import { Avatar, Button } from '../ui'

/** Shared frame: soft canvas, a big faint code behind a navy icon block, then the message and actions. */
function Frame({ code, icon: Icon, title, body, children }: { code: string; icon: typeof Lock; title: string; body: ReactNode; children?: ReactNode }) {
  return (
    <div className="grid min-h-full place-items-center bg-canvas px-8 py-16">
      <div className="relative w-full max-w-lg text-center">
        <div aria-hidden className="pointer-events-none select-none text-[160px] font-bold leading-none tracking-tighter text-fg/[0.05]">{code}</div>
        <div className="-mt-24 flex justify-center">
          <span className="brand-banner relative grid h-16 w-16 place-items-center overflow-hidden rounded-lg text-teal shadow-lg"><Icon size={28} strokeWidth={1.75} className="relative" /></span>
        </div>
        <h1 className="mt-6 text-[24px] font-semibold tracking-tight">{title}</h1>
        <div className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-muted">{body}</div>
        {children}
      </div>
    </div>
  )
}

const Actions = () => (
  <div className="mt-7 flex justify-center gap-2">
    <Button variant="secondary" onClick={() => history.back()}><ArrowLeft size={15} /> Go back</Button>
    <Link to="/dashboard" className="inline-flex h-9 items-center gap-2 rounded-md bg-teal px-3.5 text-[13px] font-medium text-night hover:brightness-95"><Compass size={15} /> Go to Dashboard</Link>
  </div>
)

/** 404: unknown address. */
export function NotFoundPage() {
  const { pathname } = useLocation()
  return (
    <Frame code="404" icon={Search} title="We can’t find that page"
      body={<>Nothing lives at <code className="rounded-sm bg-mist px-1.5 py-0.5 text-[12.5px] text-fg">{pathname}</code>. The link may be old, or the item may have moved.</>}>
      <Actions />
      <p className="mt-6 text-[12.5px] text-muted">Looking for a file? <Link to="/search" className="font-medium text-accent hover:underline">Search H Drive</Link></p>
    </Frame>
  )
}

/** 403: an admin-only page opened by a member. */
export function AdminOnlyPage() {
  return (
    <Frame code="403" icon={ShieldX} title="This page is for admins"
      body="Access, Users, the Audit log and Settings are managed by H Drive admins. If you need a change made there, ask one of them.">
      <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-3 rounded-lg bg-surface p-3 text-left shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
        <Avatar user={users[0]} size={34} />
        <div className="min-w-0 flex-1"><div className="text-[13px] font-medium">{users[0].name}</div><div className="truncate text-[12px] text-muted">{users[0].email}</div></div>
        <a href={`mailto:${users[0].email}`} className="text-[12.5px] font-medium text-accent hover:underline">Email</a>
      </div>
      <Actions />
    </Frame>
  )
}

/** 403 on a folder/file: explain, show the owner, and let them ask for access. */
export function NoAccessPage({ folderId }: { folderId: string }) {
  const name = folderPath(folderId).at(-1)?.name ?? 'this folder'
  const owner = users[0]
  const [role, setRole] = useState('viewer')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  return (
    <Frame code="403" icon={Lock} title={`You don’t have access to “${name}”`}
      body="It hasn’t been shared with you. Ask the owner for access. They’ll get an alert and can approve it in one click.">
      <div className="mx-auto mt-6 max-w-md rounded-lg bg-surface p-5 text-left shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
        <div className="flex items-center gap-3">
          <Avatar user={owner} size={34} />
          <div className="flex-1"><div className="text-[13px] font-medium">{owner.name}</div><div className="text-[12px] text-muted">Owner · {name}</div></div>
        </div>
        {sent ? (
          <div role="status" className="mt-4 flex items-start gap-3 rounded-md bg-teal/10 p-3.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal text-night"><Check size={14} /></span>
            <div className="text-[13px]"><div className="font-medium">Request sent</div><div className="text-fg/70">We’ll let you know in Alerts when {owner.name.split(' ')[0]} responds.</div></div>
          </div>
        ) : (
          /* Backend: POST /items/:id/access-requests { role, note } → appears on the owner's Dashboard */
          <form className="mt-4 space-y-3" onSubmit={e => { e.preventDefault(); setSent(true) }}>
            <label className="block text-[12.5px] font-medium">Access you need
              <select value={role} onChange={e => setRole(e.target.value)} className="mt-1.5 h-9 w-full rounded-md border border-line bg-surface px-2.5 text-[13px] font-normal outline-none focus:border-teal">
                <option value="viewer">Viewer: open and download</option>
                <option value="contributor">Contributor: also upload</option>
                <option value="editor">Editor: also rename, move and edit details</option>
              </select>
            </label>
            <label className="block text-[12.5px] font-medium">Note <span className="font-normal text-muted">(optional)</span>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Why do you need it?" className="mt-1.5 w-full resize-none rounded-md border border-line bg-surface px-3 py-2 text-[13px] font-normal outline-none placeholder:text-muted focus:border-teal" />
            </label>
            <Button type="submit" className="w-full justify-center bg-teal text-night hover:brightness-95"><Send size={15} /> Request access</Button>
          </form>
        )}
      </div>
      <Actions />
    </Frame>
  )
}
