import { useEffect, useRef, useState, type ReactNode } from 'react'
import { File, FileSpreadsheet, FileText, FileType2, Folder as FolderIcon, type LucideIcon } from 'lucide-react'
import type { DocStatus, Item, User } from './types'

export const fmtSize = (b: number) =>
  b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const initials = (u: User) => u.name.split(' ').map(p => p[0]).slice(0, 2).join('')

export function Avatar({ user, size = 24 }: { user: User; size?: number }) {
  return (
    <span title={user.name} style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="inline-grid shrink-0 place-items-center rounded-sm bg-teal/12 font-semibold text-accent ring-1 ring-teal/25">
      {initials(user)}
    </span>
  )
}

const statusStyle: Record<DocStatus, [string, string]> = {
  draft: ['Draft', 'bg-mist text-fg/70'],
  in_review: ['In review', 'bg-navy/8 text-accent'],
  approved: ['Approved', 'bg-teal/12 text-teal-fg'],
}
export function StatusBadge({ status }: { status: DocStatus }) {
  const [label, cls] = statusStyle[status]
  return <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11.5px] font-medium ${cls}`}>{label}</span>
}

const extIcon: Record<string, LucideIcon> = { pdf: FileType2, xlsx: FileSpreadsheet, csv: FileSpreadsheet, docx: FileText, md: FileText, txt: FileText }
export function ItemIcon({ item, size = 18 }: { item: Item; size?: number }) {
  if (item.kind === 'folder') return <FolderIcon size={size} strokeWidth={1.75} className="shrink-0 fill-teal/20 text-accent" />
  const Icon = extIcon[item.name.split('.').pop()!.toLowerCase()] ?? File
  return <Icon size={size} strokeWidth={1.75} className="shrink-0 text-fg/60" />
}

export function Button({ variant = 'ghost', className = '', ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const v = {
    primary: 'bg-navy text-paper hover:bg-[#012c47]',
    secondary: 'border border-line bg-surface hover:bg-mist',
    ghost: 'text-fg/70 hover:bg-mist hover:text-fg',
  }[variant]
  return <button {...p} className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors disabled:opacity-40 ${v} ${className}`} />
}

/** Dropdown menu. ponytail: hand-rolled; swap for Radix/shadcn if keyboard arrow-nav is needed. */
export function Menu({ trigger, children, align = 'right' }: { trigger: ReactNode; children: ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', close)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close) }
  }, [open])
  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div onClick={() => setOpen(false)} role="menu"
          className={`absolute z-30 mt-1.5 min-w-52 rounded-lg border border-line bg-surface p-1 shadow-[0_8px_30px_rgba(2,6,23,0.08)] ${align === 'right' ? 'right-0' : 'left-0'}`}>
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({ icon: Icon, children, danger, hint, onClick }: { icon?: LucideIcon; children: ReactNode; danger?: boolean; hint?: string; onClick?: () => void }) {
  return (
    <button role="menuitem" onClick={onClick}
      className={`flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] ${danger ? 'text-red-600 hover:bg-red-50' : 'text-fg hover:bg-mist'}`}>
      {Icon && <Icon size={15} strokeWidth={1.75} className={danger ? '' : 'text-fg/60'} />}
      <span className="flex-1">{children}</span>
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </button>
  )
}
export const MenuDivider = () => <div className="my-1 h-px bg-line" />
