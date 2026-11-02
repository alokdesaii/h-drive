import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, Check, FileStack, GitPullRequestArrow, HardDrive, Lock, Mail, MoreHorizontal, Pencil, Plus, Share2, Trash2 } from 'lucide-react'
import { getSettings, listDocumentTypes } from '../api'
import type { DocStatus, DocumentType, Role, WorkspaceSettings } from '../types'
import { Button, Dialog, Menu, MenuItem, useToast } from '../ui'

const SECTIONS = [
  ['general', 'General', Building2], ['sharing', 'Sharing & access', Share2], ['types', 'Document types', FileStack],
  ['review', 'Review & statuses', GitPullRequestArrow], ['retention', 'Storage & retention', HardDrive], ['notifications', 'Notifications', Mail],
] as const
const TYPE_COLORS = ['#023e63', '#00bfb3', '#6366f1', '#f59e0b', '#e11d48', '#94a3b8']

export default function SettingsPage() {
  const [saved, setSaved] = useState<WorkspaceSettings | null>(null)
  const [s, setS] = useState<WorkspaceSettings | null>(null)
  const [types, setTypes] = useState<DocumentType[]>([])
  const [params, setParams] = useSearchParams()
  const active = SECTIONS.some(x => x[0] === params.get('section')) ? params.get('section')! : 'general'
  const setActive = (id: string) => setParams({ section: id }, { replace: true })
  const [editing, setEditing] = useState<DocumentType | 'new' | null>(null)
  const [removing, setRemoving] = useState<DocumentType | null>(null)
  const [toast, showToast] = useToast()

  useEffect(() => { getSettings().then(v => { setSaved(v); setS(structuredClone(v)) }); listDocumentTypes().then(setTypes) }, [])

  if (!s || !saved) return <div className="px-8 py-7"><div className="h-6 w-40 animate-pulse rounded bg-mist" /></div>
  const set = <K extends keyof WorkspaceSettings>(k: K, v: WorkspaceSettings[K]) => setS({ ...s, [k]: v })
  const dirty = JSON.stringify(s) !== JSON.stringify(saved)

  return (
    <div className="min-h-full bg-canvas px-8 py-7 pb-28">
      <h1 className="text-[24px] font-semibold tracking-tight">Settings</h1>
      <p className="mt-0.5 text-[13px] text-muted">Workspace-wide rules for H Drive. Changes apply to everyone.</p>

      <div className="mt-7 grid grid-cols-[230px_1fr] gap-6">
        <nav aria-label="Settings sections" className="sticky top-6 self-start rounded-lg bg-surface p-2 shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
          <ul className="space-y-0.5">
            {SECTIONS.map(([id, label, Icon]) => (
              <li key={id}>
                <button onClick={() => setActive(id)} aria-current={active === id ? 'page' : undefined}
                  className={`relative flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-[13px] ${active === id ? 'bg-teal/12 font-medium text-teal-fg' : 'text-fg/70 hover:bg-mist hover:text-fg'}`}>
                  {active === id && <span className="absolute -left-px top-2 bottom-2 w-[3px] rounded-r bg-teal" />}
                  <Icon size={15} strokeWidth={1.75} />{label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-3xl">
          {active === 'general' && <Panel title="General" desc="How the workspace appears and who can sign in." stat={<Stat value={`@${s.domain}`} label="sign-in domain" small />}>
            <Row label="Workspace name" hint="Shown on the sign-in page and in emails.">
              <input value={s.workspaceName} onChange={e => set('workspaceName', e.target.value)} className={input} />
            </Row>
            <Row label="Sign-in domain" hint="Only Google Workspace accounts on this domain can sign in.">
              <div className="flex items-center gap-2 text-[13px]"><Lock size={13} className="text-muted" /><span className="font-medium">@{s.domain}</span><span className="text-muted">· managed by IT</span></div>
            </Row>
            <Row label="Sign people out after" hint="Inactive sessions end after this long.">
              <Select value={s.sessionTimeoutHours} onChange={v => set('sessionTimeoutHours', +v)} options={[[1, '1 hour'], [8, '8 hours'], [12, '12 hours'], [24, '24 hours'], [168, '7 days']]} />
            </Row>
          </Panel>}

          {active === 'sharing' && <Panel title="Sharing & access" desc="Defaults when people share files and folders." stat={<Stat value={s.allowPublicLinks ? 'Public links on' : 'Private'} label="by default" small />}>
            <Row label="Default role when sharing" hint="Pre-selected in every Share dialog. People can still pick another role.">
              <Select value={s.defaultShareRole} onChange={v => set('defaultShareRole', v as Role)} options={[['viewer', 'Viewer'], ['contributor', 'Contributor'], ['editor', 'Editor']]} />
            </Row>
            <Row label="Links for anyone with the link" hint={s.allowPublicLinks ? 'On: files can be opened without signing in. Still recorded in the Audit log.' : 'Off: every file stays private to signed-in Harbour & Hills staff.'} warn={s.allowPublicLinks}>
              <Toggle on={s.allowPublicLinks} onChange={v => set('allowPublicLinks', v)} />
            </Row>
          </Panel>}

          {active === 'types' && <Panel title="Document types" desc="Categories people pick when uploading. Used for filters and search." stat={<Stat value={types.length} label={`types · ${types.reduce((a, t) => a + t.documentCount, 0).toLocaleString()} documents`} />}
            action={<Button className="bg-teal text-night hover:brightness-95" onClick={() => setEditing('new')}><Plus size={15} /> Add type</Button>}>
            {types.map(t => (
              <div key={t.id} className="group flex items-center gap-4 py-4">
                <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: t.color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium">{t.name}</div>
                  <div className="truncate text-[12px] text-muted">{t.description || 'No description'}</div>
                </div>
                <div className="text-right"><div className="text-[15px] font-semibold tabular-nums">{t.documentCount.toLocaleString()}</div><div className="text-[11px] text-muted">documents</div></div>
                <Menu trigger={<button aria-label={`Actions for ${t.name}`} className="grid h-8 w-8 place-items-center rounded-md text-muted opacity-0 hover:bg-mist hover:text-fg group-hover:opacity-100 focus:opacity-100"><MoreHorizontal size={16} /></button>}>
                  <MenuItem icon={Pencil} onClick={() => setEditing(t)}>Edit</MenuItem>
                  <MenuItem icon={Trash2} danger onClick={() => types.length <= 1 ? showToast('Keep at least one document type') : setRemoving(t)}>Delete</MenuItem>
                </Menu>
              </div>
            ))}
          </Panel>}

          {active === 'review' && <Panel title="Review & statuses" desc="The stages a document moves through." stat={<Stat value={s.requireReview ? 3 : 2} label="stages to approval" />}>
            <Row label="Require review before approval" hint="Documents go through a review stage before Approved. Off lets editors approve directly.">
              <Toggle on={s.requireReview} onChange={v => set('requireReview', v)} />
            </Row>
            <Row label="Stage names" hint="Rename the stages to match your language. The order stays the same." stack>
              <ol className="flex items-center gap-3">
                {(['draft', 'in_review', 'approved'] as DocStatus[]).filter(k => s.requireReview || k !== 'in_review').map((k, i, arr) => (
                  <li key={k} className="flex flex-1 items-center gap-3">
                    <input value={s.statusLabels[k]} aria-label={`Name for stage ${i + 1}`} onChange={e => set('statusLabels', { ...s.statusLabels, [k]: e.target.value })} className={`${input} font-medium`} />
                    {i < arr.length - 1 && <span className="text-muted">→</span>}
                  </li>
                ))}
              </ol>
            </Row>
          </Panel>}

          {active === 'retention' && <Panel title="Storage & retention" desc="How long things are kept, and how much space the workspace has." stat={<Stat value="412 GB" label={`of ${s.storageQuotaGb.toLocaleString()} GB used`} />}>
            <Row label="Storage" hint="The plan is managed by IT. Contact them to increase it." stack>
              <div className="h-2 rounded-[1px] bg-line"><div className="h-2 w-[41%] rounded-[1px] bg-teal" /></div>
              <div className="mt-2 flex justify-between text-[12px] text-muted"><span><span className="font-medium text-fg">41%</span> used</span><span><span className="font-medium text-fg">{(s.storageQuotaGb - 412).toLocaleString()} GB</span> free</span></div>
            </Row>
            <Row label="Empty trash after" hint="Items in Trash are then deleted forever.">
              <Select value={s.trashRetentionDays} onChange={v => set('trashRetentionDays', +v)} options={[[7, '7 days'], [30, '30 days'], [90, '90 days'], [365, '1 year']]} />
            </Row>
            <Row label="Versions to keep per file" hint="Older versions beyond this are removed.">
              <Select value={s.versionsToKeep ?? 0} onChange={v => set('versionsToKeep', +v || null)} options={[[0, 'Keep all'], [10, 'Last 10'], [25, 'Last 25'], [50, 'Last 50']]} />
            </Row>
            <Row label="Auto-archive untouched files" hint="Files nobody has opened for this long move to Archived.">
              <Select value={s.autoArchiveDays ?? 0} onChange={v => set('autoArchiveDays', +v || null)} options={[[0, 'Never'], [180, 'After 6 months'], [365, 'After 1 year'], [730, 'After 2 years']]} />
            </Row>
          </Panel>}

          {active === 'notifications' && <Panel title="Notifications" desc="Defaults for everyone. People can change their own in Manage alerts." stat={<Stat value={s.emailDigest === 'off' ? 'Off' : s.emailDigest[0].toUpperCase() + s.emailDigest.slice(1)} label="email summary" />}>
            <Row label="Email summary of alerts" hint="A digest of activity on things people follow.">
              <Segmented value={s.emailDigest} onChange={v => set('emailDigest', v)} options={[['off', 'Off'], ['daily', 'Daily'], ['weekly', 'Weekly']]} />
            </Row>
          </Panel>}
        </div>
      </div>

      {/* Save bar: appears only when something changed */}
      <div className={`fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-lg border border-line bg-surface py-2.5 pl-5 pr-2.5 shadow-[0_12px_40px_rgba(2,6,23,0.18)] transition-all ${dirty ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}>
        <span className="flex items-center gap-2 text-[13px]"><span className="h-2 w-2 rounded-full bg-teal" /> You have unsaved changes</span>
        <Button variant="secondary" onClick={() => setS(structuredClone(saved))}>Discard</Button>
        <Button className="bg-teal text-night hover:brightness-95" onClick={() => { setSaved(structuredClone(s)); showToast('Settings saved') }}><Check size={15} /> Save changes</Button>
      </div>

      <TypeDialog value={editing} existing={types} onClose={() => setEditing(null)} onSave={t => {
        setTypes(ts => editing === 'new' ? [...ts, t] : ts.map(x => x.id === t.id ? t : x))
        showToast(editing === 'new' ? `“${t.name}” added` : `“${t.name}” updated`); setEditing(null)
      }} />
      <DeleteTypeDialog type={removing} others={types.filter(t => t.id !== removing?.id)} onClose={() => setRemoving(null)} onConfirm={to => {
        const r = removing!
        setTypes(ts => ts.filter(t => t.id !== r.id).map(t => t.name === to ? { ...t, documentCount: t.documentCount + r.documentCount } : t))
        showToast(r.documentCount ? `“${r.name}” deleted · ${r.documentCount.toLocaleString()} documents moved to ${to}` : `“${r.name}” deleted`); setRemoving(null)
      }} />
      {toast}
    </div>
  )
}

const input = 'h-9 w-full rounded-md border border-line bg-surface px-3 text-[13px] outline-none focus:border-teal'

/** Section = navy banner (icon, title, key figure) + one white card of rows. Matches the Dashboard's hero card. */
function Panel({ title, desc, stat, action, children }: { title: string; desc: string; stat?: ReactNode; action?: ReactNode; children: ReactNode }) {
  const Icon = SECTIONS.find(x => x[1] === title)![2]
  return (
    <section className="space-y-4">
      <header className="brand-banner relative overflow-hidden rounded-lg px-6 py-5 text-paper">
        <div className="relative flex items-center gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-teal text-night"><Icon size={20} strokeWidth={1.75} /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[19px] font-semibold tracking-tight">{title}</h2>
            <p className="mt-0.5 text-[13px] text-paper/65">{desc}</p>
          </div>
          {stat}
          {action}
        </div>
      </header>
      <div className="rounded-lg bg-surface px-6 shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
        <div className="divide-y divide-line">{children}</div>
      </div>
    </section>
  )
}

function Stat({ value, label, small }: { value: ReactNode; label: string; small?: boolean }) {
  return (
    <div className="shrink-0 border-l border-paper/15 pl-5 text-right">
      <div className={`${small ? 'text-[17px]' : 'text-[28px]'} font-bold leading-none tabular-nums`}>{value}</div>
      <div className="mt-1.5 text-[11.5px] text-teal">{label}</div>
    </div>
  )
}

/** One setting per row: label + hint left, control right. `stack` puts the control underneath (wide controls). */
function Row({ label, hint, warn, stack, children }: { label: string; hint: string; warn?: boolean; stack?: boolean; children: ReactNode }) {
  return (
    <div className={`py-5 ${stack ? '' : 'grid grid-cols-[1fr_280px] items-center gap-8'}`}>
      <div>
        <div className="text-[13.5px] font-medium">{label}</div>
        <div className={`mt-0.5 text-[12.5px] ${warn ? 'text-amber-600' : 'text-muted'}`}>{hint}</div>
      </div>
      <div className={stack ? 'mt-4' : 'flex justify-end'}>{children}</div>
    </div>
  )
}

function Segmented<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: (readonly [T, string])[] }) {
  return (
    <div className="flex rounded-md border border-line p-0.5">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`h-8 flex-1 rounded-sm px-3 text-[12.5px] font-medium ${value === v ? 'bg-teal text-night' : 'text-fg/60 hover:bg-mist hover:text-fg'}`}>{l}</button>
      ))}
    </div>
  )
}

function Select({ value, onChange, options }: { value: string | number; onChange: (v: string) => void; options: (readonly [string | number, string])[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={input}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-teal' : 'bg-line'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-[left] ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

function TypeDialog({ value, existing, onClose, onSave }: {
  value: DocumentType | 'new' | null; existing: DocumentType[]; onClose: () => void; onSave: (t: DocumentType) => void
}) {
  const [t, setT] = useState<DocumentType>({ id: '', name: '', color: TYPE_COLORS[2], description: '', documentCount: 0 })
  useEffect(() => {
    if (value) setT(value === 'new' ? { id: `t${Date.now()}`, name: '', color: TYPE_COLORS[3], description: '', documentCount: 0 } : { ...value })
  }, [value])
  const clash = existing.some(x => x.id !== t.id && x.name.trim().toLowerCase() === t.name.trim().toLowerCase())
  const ok = t.name.trim() && !clash
  return (
    <Dialog open={!!value} onClose={onClose} title={value === 'new' ? 'Add document type' : 'Edit document type'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!ok} onClick={() => onSave({ ...t, name: t.name.trim() })}>{value === 'new' ? 'Add type' : 'Save'}</Button></>}>
      <label className="text-[12.5px] font-medium">Name</label>
      <input autoFocus value={t.name} onChange={e => setT({ ...t, name: e.target.value })} placeholder="e.g. Invoice" className={`${input} mt-1.5 ${clash ? 'border-red-500' : ''}`} />
      {clash && <p className="mt-1 text-[12px] text-red-600">A type with this name already exists.</p>}
      <label className="mt-4 block text-[12.5px] font-medium">Description <span className="font-normal text-muted">(optional)</span></label>
      <input value={t.description} onChange={e => setT({ ...t, description: e.target.value })} placeholder="What goes in this type?" className={`${input} mt-1.5`} />
      <div className="mt-4 text-[12.5px] font-medium">Colour</div>
      <div className="mt-1.5 flex gap-2">
        {TYPE_COLORS.map(c => (
          <button key={c} onClick={() => setT({ ...t, color: c })} aria-label={`Colour ${c}`}
            className={`grid h-8 w-8 place-items-center rounded-md ring-offset-2 ring-offset-surface ${t.color === c ? 'ring-2 ring-teal' : ''}`} style={{ background: c }}>
            {t.color === c && <Check size={14} className="text-paper" />}
          </button>
        ))}
      </div>
    </Dialog>
  )
}

function DeleteTypeDialog({ type, others, onClose, onConfirm }: { type: DocumentType | null; others: DocumentType[]; onClose: () => void; onConfirm: (moveTo: string) => void }) {
  const [to, setTo] = useState('')
  useEffect(() => { setTo(others.find(o => o.name === 'General')?.name ?? others[0]?.name ?? '') }, [type]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Dialog open={!!type} onClose={onClose} title={`Delete “${type?.name}”?`}
      description={type?.documentCount ? `${type.documentCount.toLocaleString()} documents use this type. Choose where they go.` : 'No documents use this type.'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button className="bg-red-600 text-paper hover:bg-red-700" onClick={() => onConfirm(to)}><Trash2 size={15} /> Delete type</Button></>}>
      {type && type.documentCount > 0 ? (
        <>
          <label className="text-[12.5px] font-medium">Move its documents to</label>
          <select value={to} onChange={e => setTo(e.target.value)} className={`${input} mt-1.5`}>{others.map(o => <option key={o.id}>{o.name}</option>)}</select>
        </>
      ) : <p className="text-[13px] text-fg/70">It will be removed from the list. This can’t be undone.</p>}
    </Dialog>
  )
}
