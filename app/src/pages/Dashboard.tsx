import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity as ActivityIcon, ArrowUpRight, Check, Clock, Download, Eye, FileStack, FileUp, HardDrive,
  KeyRound, MoreHorizontal, Share2, ShieldAlert, UserPlus, X,
} from 'lucide-react'
import { users } from '../api'
import { audit } from '../mock'
import { Avatar, fmtDateTime } from '../ui'

// GET /admin/dashboard?range=week|month|year — backend returns these aggregates; mock values below.
const RANGES = ['Week', 'Month', 'Year'] as const
const HERO: Record<typeof RANGES[number], { docs: string; delta: string }> = {
  Week: { docs: '12,480', delta: '+214' }, Month: { docs: '12,480', delta: '+968' }, Year: { docs: '12,480', delta: '+7,312' },
}
const STORAGE = { used: 412, total: 1000 }
const STORAGE_BY_FOLDER = [['Finance', 118], ['Legal & Contracts', 96], ['Technology and Data', 84], ['HR & People', 61]] as const
const ACTIVITY = [['Views', 412, Eye], ['Downloads', 188, Download], ['Uploads', 97, FileUp], ['Shares', 48, Share2]] as const

const label = (a: string) => a.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ (\w)/g, (_, c) => ' ' + c.toLowerCase())

export default function Dashboard() {
  const [range, setRange] = useState<typeof RANGES[number]>('Week')
  const [request, setRequest] = useState<'pending' | 'approved' | 'declined'>('pending')

  return (
    <div className="min-h-full bg-mist px-8 py-7">
      {/* Greeting row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar user={users[0]} size={44} />
          <div>
            <h1 className="text-[22px] font-medium tracking-tight">Hello, {users[0].name.split(' ')[0]}</h1>
            <p className="text-[12.5px] text-muted">Here's what's happening in H Drive</p>
          </div>
        </div>
        <div className="flex rounded-sm bg-paper p-1 shadow-sm">
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`h-8 rounded-sm px-4 text-[12.5px] font-medium transition-colors ${range === r ? 'bg-navy text-paper' : 'text-ink/60 hover:text-navy'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: hero + accent card */}
      <div className="mt-6 grid grid-cols-[1.45fr_1fr] gap-5">
        <Card className="relative flex flex-col justify-between overflow-hidden">
          <div className="flex items-start justify-between">
            <Chip icon={FileStack}>Total documents</Chip>
            <div className="text-right">
              <div className="text-[11.5px] text-muted">Workspace</div>
              <div className="text-[14px] font-medium">Harbour &amp; Hills</div>
            </div>
          </div>
          <div className="mt-8">
            <div className="flex items-end gap-3">
              <span className="text-[56px] font-light leading-none tracking-tight tabular-nums">{HERO[range].docs}</span>
              <span className="mb-2 rounded-sm bg-teal/15 px-2.5 py-1 text-[12px] font-medium text-[#00766f]">{HERO[range].delta} this {range.toLowerCase()}</span>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2">
            <Link to="/documents" className="inline-flex h-10 items-center gap-2 rounded-sm bg-navy px-5 text-[13px] font-medium text-paper hover:bg-[#012c47]"><FileUp size={15} /> Upload files</Link>
            <Link to="/users" className="inline-flex h-10 items-center gap-2 rounded-sm border border-navy/25 px-5 text-[13px] font-medium text-navy hover:bg-navy/5"><UserPlus size={15} /> Invite people</Link>
            <button className="grid h-10 w-10 place-items-center rounded-sm text-ink/60 hover:bg-mist" aria-label="More"><MoreHorizontal size={18} /></button>
          </div>
          <Link to="/documents" aria-label="Open documents"
            className="absolute bottom-6 right-6 grid h-16 w-16 place-items-center rounded-sm bg-teal text-night transition-transform hover:scale-105">
            <ArrowUpRight size={26} strokeWidth={1.75} />
          </Link>
        </Card>

        {/* Accent card */}
        <section className="relative overflow-hidden rounded-lg bg-navy p-6 text-paper">
          <BrandShape />
          <div className="relative flex items-center justify-between">
            <span className="inline-flex h-9 items-center gap-2 rounded-sm bg-paper/10 pl-4 pr-1 text-[12px] font-semibold uppercase tracking-wider ring-1 ring-paper/15">
              Needs review
              <span className="grid h-7 w-7 place-items-center rounded-sm bg-teal text-night"><Clock size={14} /></span>
            </span>
            <Link to="/search" className="grid h-9 w-9 place-items-center rounded-sm bg-paper/10 hover:bg-paper/20" aria-label="View documents in review"><ArrowUpRight size={16} /></Link>
          </div>
          <div className="relative mt-8 text-[12.5px] text-paper/60">Documents awaiting approval</div>
          <div className="relative mt-1 flex items-end gap-3">
            <span className="text-[52px] font-light leading-none tabular-nums">7</span>
            <span className="mb-1.5 rounded-sm bg-teal px-2.5 py-0.5 text-[11.5px] font-medium text-night">3 overdue</span>
          </div>
          <div className="relative mt-6 grid grid-cols-2 gap-3">
            <MiniTile label="Approved this week" value="24" />
            <MiniTile label="Avg. time to approve" value="2.4 d" />
          </div>
        </section>
      </div>

      {/* Row 2 */}
      <div className="mt-5 grid grid-cols-3 gap-5">
        {/* Storage ring */}
        <Card>
          <CardHead icon={HardDrive} title="Storage" right={<Link to="/settings" className="rounded-sm border border-line px-3 py-1 text-[12px] font-medium hover:border-navy/30 hover:text-navy">1 TB plan</Link>} />
          <Ring used={STORAGE.used} total={STORAGE.total} />
          <div className="mx-auto mt-3 w-fit rounded-sm border border-line px-3 py-1 text-[12px] text-ink/70">
            Finance grew <span className="font-medium text-[#00766f]">+6.2 GB</span> this week
          </div>
          <ul className="mt-5 space-y-2 text-[12.5px]">
            {STORAGE_BY_FOLDER.map(([name, gb], i) => (
              <li key={name} className={`flex justify-between gap-2 ${i === 0 ? 'text-ink' : 'text-ink/50'}`}>
                <span className="truncate">{name}</span><span className="tabular-nums">{gb} GB</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Activity breakdown */}
        <Card>
          <CardHead icon={ActivityIcon} title="Activity" right={<span className="text-[12px] text-muted">this {range.toLowerCase()}</span>} />
          <div className="mt-4 text-[40px] font-light leading-none tracking-tight tabular-nums">745</div>
          <div className="mt-1.5 text-[12px]"><span className="font-medium text-[#00766f]">+12%</span> <span className="text-muted">vs last {range.toLowerCase()}</span></div>
          <ul className="mt-6 space-y-4">
            {ACTIVITY.map(([name, n, Icon], i) => {
              const pct = Math.round((n / 745) * 100)
              return (
                <li key={name} title={`${name}: ${n} (${pct}%)`}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className={`flex items-center gap-1.5 ${i === 0 ? 'font-medium' : 'text-ink/70'}`}><Icon size={13} className="text-muted" />{name}</span>
                    <span className="tabular-nums text-ink/70">{n}</span>
                  </div>
                  <div className="relative mt-1.5 h-2 rounded-[1px] bg-mist">
                    <div className={`h-2 rounded-[1px] ${i === 0 ? 'bg-teal' : 'bg-navy/20'}`} style={{ width: `${pct}%` }} />
                    {i === 0 && <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-navy px-2 py-0.5 text-[10.5px] font-semibold text-paper" style={{ left: `${pct}%` }}>{pct}%</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>

        {/* Requests & activity feed */}
        <Card>
          <CardHead icon={KeyRound} title="Requests & activity" right={<Link to="/audit" className="grid h-9 w-9 place-items-center rounded-sm border border-line text-ink/60 hover:text-navy" aria-label="Open audit log"><MoreHorizontal size={16} /></Link>} />
          <div className={`mt-4 rounded-md border p-3 transition-colors ${request === 'pending' ? 'border-teal/40 bg-teal/[0.06]' : 'border-line'}`}>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-paper ring-1 ring-line"><ShieldAlert size={16} className="text-navy" /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">Editor access request</div>
                <div className={`text-[11.5px] ${request === 'pending' ? 'text-[#00766f]' : 'text-muted'}`}>
                  {request === 'pending' ? 'Priya Shah · Board Papers' : request === 'approved' ? 'Approved' : 'Declined'}
                </div>
              </div>
              {request === 'pending' && <>
                <button onClick={() => setRequest('approved')} aria-label="Approve" className="grid h-8 w-8 place-items-center rounded-sm bg-teal text-night hover:brightness-95"><Check size={15} /></button>
                <button onClick={() => setRequest('declined')} aria-label="Decline" className="grid h-8 w-8 place-items-center rounded-sm bg-paper text-ink/60 ring-1 ring-line hover:text-red-600"><X size={15} /></button>
              </>}
            </div>
          </div>
          <ul className="mt-2 divide-y divide-line">
            {audit.slice(0, 4).map(a => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <Avatar user={a.user} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{label(a.action)}</div>
                  <div className="truncate text-[11.5px] text-muted">{a.entityName}</div>
                </div>
                <div className="text-right text-[11.5px] text-muted">{fmtDateTime(a.at).split(',')[0]}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}

const Card = ({ className = '', children }: { className?: string; children: React.ReactNode }) =>
  <section className={`rounded-lg bg-paper p-6 ${className}`}>{children}</section>

function CardHead({ icon: Icon, title, right }: { icon: typeof Clock; title: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between">
      <span className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-sm ring-1 ring-line"><Icon size={16} strokeWidth={1.75} className="text-navy" /></span>
        <h2 className="text-[15px] font-medium">{title}</h2>
      </span>
      {right}
    </header>
  )
}

const Chip = ({ icon: Icon, children }: { icon: typeof Clock; children: string }) => (
  <span className="inline-flex h-9 items-center gap-2 rounded-sm bg-mist px-3.5 text-[12.5px] font-medium">
    <Icon size={15} className="text-navy" />{children}
  </span>
)

const MiniTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md bg-paper/8 p-4 ring-1 ring-paper/10">
    <div className="text-[11.5px] text-paper/60">{label}</div>
    <div className="mt-1 text-[20px] font-light tabular-nums">{value}</div>
  </div>
)

/** Segmented ring: used vs free, single hue. 24 segments with 2px-ish gaps like the reference. */
function Ring({ used, total }: { used: number; total: number }) {
  const N = 24, r = 64, c = 2 * Math.PI * r, seg = c / N, gap = 3.5
  const filled = Math.round((used / total) * N)
  return (
    <div className="relative mx-auto mt-4 h-44 w-44" title={`${used} GB of ${total} GB used`}>
      <svg viewBox="0 0 160 160" className="-rotate-90">
        {Array.from({ length: N }, (_, i) => (
          <circle key={i} cx="80" cy="80" r={r} fill="none" strokeWidth="14"
            stroke={i < filled ? 'var(--color-teal)' : 'var(--color-line)'}
            strokeDasharray={`${seg - gap} ${c - seg + gap}`} strokeDashoffset={-i * seg} />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[26px] font-light leading-none tabular-nums">{used} GB</div>
          <div className="mt-1 text-[11.5px] text-muted">of {total / 1000} TB · {Math.round((used / total) * 100)}%</div>
        </div>
      </div>
    </div>
  )
}

/** Minimal abstract backdrop: soft teal glow + fine dot grid fading out from the top-right corner. */
const BrandShape = () => (
  <>
    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal/25 blur-3xl" aria-hidden />
    <div aria-hidden className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.28) 1px, transparent 1.2px)',
        backgroundSize: '14px 14px',
        maskImage: 'radial-gradient(circle at 100% 0%, #000 0%, transparent 60%)',
        WebkitMaskImage: 'radial-gradient(circle at 100% 0%, #000 0%, transparent 60%)',
      }} />
  </>
)
