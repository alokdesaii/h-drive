import { useState } from 'react'
import { ChevronRight, Info, Search } from 'lucide-react'
import { folderPath, listFolders } from '../api'
import type { Folder } from '../types'
import { ItemIcon } from '../ui'
import { Access } from './DetailsDrawer'

const ROLE_HELP: [string, string][] = [
  ['Viewer', 'View, download and set alerts'],
  ['Contributor', 'Viewer + upload files and new versions'],
  ['Editor', 'Contributor + rename, move, edit details, archive'],
  ['Owner', 'Editor + share, manage access, move to trash'],
]

export default function AccessPage() {
  const folders = listFolders()
  const [selected, setSelected] = useState(folders[0].id)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<Set<string>>(new Set())
  const current = folders.find(f => f.id === selected)!
  const path = ['Documents', ...folderPath(current.parentId).map(f => f.name)].join(' / ')

  const Node = ({ f, depth }: { f: Folder; depth: number }) => {
    const kids = folders.filter(c => c.parentId === f.id)
    const isOpen = open.has(f.id) || !!q
    if (q && !f.name.toLowerCase().includes(q.toLowerCase()) && !kids.length) return null
    return (
      <li>
        <button onClick={() => setSelected(f.id)} style={{ paddingLeft: 8 + depth * 16 }}
          className={`flex h-9 w-full items-center gap-2 rounded-md pr-2 text-left text-[13px] ${selected === f.id ? 'bg-navy/8 font-medium text-accent' : 'text-fg/80 hover:bg-mist'}`}>
          <span onClick={e => { e.stopPropagation(); setOpen(s => { const n = new Set(s); n.has(f.id) ? n.delete(f.id) : n.add(f.id); return n }) }}
            className={`grid h-5 w-5 place-items-center rounded text-muted hover:bg-navy/10 ${kids.length ? '' : 'invisible'}`}>
            <ChevronRight size={13} className={isOpen ? 'rotate-90' : ''} />
          </span>
          <ItemIcon item={f} size={16} />
          <span className="truncate">{f.name}</span>
        </button>
        {isOpen && kids.length > 0 && <ul>{kids.map(k => <Node key={k.id} f={k} depth={depth + 1} />)}</ul>}
      </li>
    )
  }

  return (
    <div className="px-8 py-7">
      <h1 className="text-[24px] font-semibold tracking-tight">Access</h1>
      <p className="mt-0.5 text-[13px] text-muted">Choose a folder to see and change who can open it. Subfolders and files inherit access.</p>

      <div className="mt-6 grid grid-cols-[280px_1fr] gap-6">
        <aside className="self-start rounded-xl border border-line p-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Find a folder"
              className="h-8 w-full rounded-md border border-line pl-8 pr-2 text-[13px] outline-none placeholder:text-muted focus:border-teal" />
          </div>
          <ul className="mt-2">{folders.filter(f => !f.parentId).map(f => <Node key={f.id} f={f} depth={0} />)}</ul>
        </aside>

        <section className="min-w-0 space-y-6">
          <div className="rounded-xl border border-line">
            <header className="flex items-center gap-3 border-b border-line bg-gradient-to-r from-navy/[0.04] to-teal/[0.06] px-6 py-4">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-surface ring-1 ring-line"><ItemIcon item={current} size={20} /></div>
              <div>
                <h2 className="text-[15px] font-semibold">{current.name}</h2>
                <p className="text-[12px] text-muted">{path} · {current.itemCount} items</p>
              </div>
            </header>
            <div className="p-6"><Access key={current.id} id={current.id} /></div>
          </div>

          <div className="rounded-xl border border-line p-6">
            <h3 className="flex items-center gap-2 text-[13px] font-semibold"><Info size={15} className="text-teal" /> What each role can do</h3>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {ROLE_HELP.map(([r, d], i) => (
                <div key={r} className="rounded-lg bg-mist px-4 py-3">
                  <dt className="flex items-center gap-2 text-[13px] font-medium text-accent">
                    <span className="flex gap-0.5">{ROLE_HELP.map((_, j) => <span key={j} className={`h-1.5 w-3 rounded-[1px] ${j <= i ? 'bg-teal' : 'bg-line'}`} />)}</span>
                    {r}
                  </dt>
                  <dd className="mt-1 text-[12.5px] text-fg/70">{d}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[12px] text-muted">Admins can manage everything in H Drive. Change admins from <span className="font-medium text-accent">Users</span>.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
