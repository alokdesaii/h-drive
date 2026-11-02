import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, ChevronRight, Clock, FileSearch, Search, SlidersHorizontal, X } from 'lucide-react'
import { DOC_TYPE_NAMES, TYPE_COLORS, listDocumentTypes, listFolders, search } from '../api'
import type { DocStatus, DocumentType, SearchResult, SearchSort } from '../types'
import { Avatar, ItemIcon, StatusBadge, fmtDate, fmtSize } from '../ui'

const STATUSES: [DocStatus, string][] = [['draft', 'Draft'], ['in_review', 'In review'], ['approved', 'Approved']]
const WITHIN: [string, string][] = [['', 'Any time'], ['7', 'Past week'], ['30', 'Past month'], ['365', 'Past year']]
const RECENT = ['lease renewal', 'budget FY27', 'NDA', 'audit']  // backend: GET /search/recent (per user)

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? '', type = params.get('type') ?? '', status = (params.get('status') ?? '') as DocStatus | ''
  const folder = params.get('folder') ?? '', within = params.get('within') ?? '', sort = (params.get('sort') ?? 'relevance') as SearchSort
  const [draft, setDraft] = useState(q)
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [types, setTypes] = useState<DocumentType[]>([])
  const input = useRef<HTMLInputElement>(null)
  const folders = listFolders()
  const searching = !!(q || type || status || folder || within)

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params); v ? next.set(k, v) : next.delete(k); setParams(next, { replace: true })
  }

  useEffect(() => { listDocumentTypes().then(setTypes) }, [])
  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => setDraft(q), [q])
  // type-ahead: update the URL 200ms after typing stops
  useEffect(() => { if (draft === q) return; const t = setTimeout(() => setParam('q', draft.trim() ? draft : ''), 200); return () => clearTimeout(t) }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!searching) { setResults(null); return }
    let live = true; setResults(null)
    search({ q, type: type || undefined, status: status || undefined, folderId: folder || undefined, withinDays: +within || undefined, sort }).then(r => live && setResults(r))
    return () => { live = false }
  }, [q, type, status, folder, within, sort, searching])

  const chips: [string, string][] = [
    ...(type ? [['type', type]] as [string, string][] : []),
    ...(status ? [['status', STATUSES.find(s => s[0] === status)![1]]] as [string, string][] : []),
    ...(folder ? [['folder', `In ${folders.find(f => f.id === folder)?.name}`]] as [string, string][] : []),
    ...(within ? [['within', WITHIN.find(w => w[0] === within)![1]]] as [string, string][] : []),
  ]

  return (
    <div className="min-h-full bg-canvas px-8 py-7">
      {/* Hero search */}
      <header className="brand-banner relative overflow-hidden rounded-lg px-8 py-8 text-paper">
        <div className="relative">
          <h1 className="text-[22px] font-semibold tracking-tight">Search H Drive</h1>
          <p className="mt-1 text-[13px] text-paper/65">Searches file names, folder names and the text inside documents.</p>
          <form className="relative mt-5 max-w-3xl" onSubmit={e => { e.preventDefault(); setParam('q', draft.trim()) }}>
            <Search size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input ref={input} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Search for a file, folder or phrase…" aria-label="Search"
              className="h-14 w-full rounded-md border-2 border-transparent bg-surface pl-12 pr-24 text-[16px] text-fg shadow-lg outline-none placeholder:text-muted focus:border-teal" />
            {draft && (
              <button type="button" onClick={() => { setDraft(''); setParam('q', '') }} aria-label="Clear search"
                className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-mist hover:text-fg"><X size={16} /></button>
            )}
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px]">
            <span className="flex items-center gap-1.5 text-paper/55"><Clock size={13} /> Recent</span>
            {RECENT.map(r => (
              <button key={r} onClick={() => { setDraft(r); setParam('q', r) }}
                className="rounded-sm bg-paper/10 px-2.5 py-1 text-paper/85 ring-1 ring-paper/10 hover:bg-paper/20">{r}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg bg-surface p-3 shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
        <span className="flex items-center gap-1.5 px-1 text-[12.5px] font-medium text-muted"><SlidersHorizontal size={14} /> Filter</span>
        <Pick value={type} onChange={v => setParam('type', v)} placeholder="Any type" options={DOC_TYPE_NAMES.map(t => [t, t])} />
        <Pick value={status} onChange={v => setParam('status', v)} placeholder="Any status" options={STATUSES} />
        <Pick value={folder} onChange={v => setParam('folder', v)} placeholder="Anywhere" options={folders.map(f => [f.id, f.parentId ? `  ${f.name}` : f.name])} />
        <div className="flex rounded-md border border-line p-0.5">
          {WITHIN.map(([v, l]) => (
            <button key={v} onClick={() => setParam('within', v)}
              className={`h-7 rounded-sm px-2.5 text-[12px] font-medium ${within === v ? 'bg-teal text-night' : 'text-fg/60 hover:bg-mist hover:text-fg'}`}>{l}</button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-[12.5px] text-muted">Sort
          <select value={sort} onChange={e => setParam('sort', e.target.value === 'relevance' ? '' : e.target.value)}
            className="h-8 rounded-md border border-line bg-surface px-2 text-[12.5px] text-fg outline-none focus:border-teal">
            <option value="relevance">Best match</option><option value="modified">Last modified</option><option value="name">Name</option>
          </select>
        </label>
      </div>
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map(([k, l]) => (
            <span key={k} className="inline-flex h-7 items-center gap-1 rounded-sm bg-teal/12 pl-2.5 pr-1 text-[12.5px] font-medium text-teal-fg">
              {k === 'type' && <span className="mr-1 h-2 w-2 rounded-sm" style={{ background: TYPE_COLORS[l] }} />}{l}
              <button onClick={() => setParam(k, '')} aria-label={`Remove ${l} filter`} className="grid h-5 w-5 place-items-center rounded-sm hover:bg-teal/20"><X size={12} /></button>
            </span>
          ))}
          <button onClick={() => setParams(q ? { q } : {}, { replace: true })} className="px-1 text-[12.5px] font-medium text-accent hover:underline">Clear all</button>
        </div>
      )}

      {!searching ? <StartState types={types} onType={t => setParam('type', t)} /> : (
        <section className="mt-5 rounded-lg bg-surface shadow-[0_1px_2px_rgba(2,6,23,0.04)]">
          <header className="flex items-baseline gap-2 border-b border-line px-6 py-4">
            {results ? <>
              <span className="text-[24px] font-bold leading-none tabular-nums">{results.length}</span>
              <span className="text-[13px] text-muted">{results.length === 1 ? 'result' : 'results'}{q && <> for <span className="font-medium text-fg">“{q}”</span></>}</span>
            </> : <span className="h-5 w-40 animate-pulse rounded bg-mist" />}
          </header>
          {!results ? (
            <div className="space-y-5 p-6">{[70, 55, 80, 45].map(w => <div key={w} className="space-y-2"><div className="h-3.5 animate-pulse rounded bg-mist" style={{ width: `${w / 2}%` }} /><div className="h-3 animate-pulse rounded bg-mist" style={{ width: `${w}%` }} /></div>)}</div>
          ) : results.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-md bg-mist"><FileSearch size={20} className="text-muted" /></span>
              <div className="mt-4 text-[15px] font-medium">No matches{q && <> for “{q}”</>}</div>
              <p className="mt-1 max-w-sm text-[13px] text-muted">Check the spelling, try a shorter phrase{chips.length ? ', or remove a filter' : ''}. Archived and trashed files aren’t searched.</p>
              {chips.length > 0 && <button onClick={() => setParams(q ? { q } : {}, { replace: true })} className="mt-4 text-[13px] font-medium text-accent hover:underline">Remove all filters</button>}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {results.map(({ item, path, excerpt }) => {
                const href = item.kind === 'folder' ? `/documents/${item.id}` : `/documents/${item.folderId ?? ''}?item=${item.id}`
                return (
                  <li key={item.id}>
                    <Link to={href} className="group flex gap-4 px-6 py-4 hover:bg-teal/[0.04]">
                      <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-md bg-mist"><ItemIcon item={item} size={19} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-medium group-hover:text-accent"><Mark text={item.name} term={q} /></span>
                          {item.kind === 'document' && <StatusBadge status={item.status} />}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[12px] text-muted">
                          {['Documents', ...path].map((p, i, a) => <span key={i} className="flex items-center gap-1">{p}{i < a.length - 1 && <ChevronRight size={11} />}</span>)}
                        </div>
                        {excerpt && <p className="mt-2 border-l-2 border-teal/40 pl-3 text-[12.5px] leading-relaxed text-fg/75"><Mark text={around(excerpt, q)} term={q} /></p>}
                      </div>
                      <div className="hidden shrink-0 text-right text-[12px] text-muted md:block">
                        {item.kind === 'document'
                          ? <div className="flex items-center justify-end gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: TYPE_COLORS[item.type] }} />{item.type} · {fmtSize(item.size)}</div>
                          : <div>Folder · {item.itemCount} items</div>}
                        <div className="mt-1.5 flex items-center justify-end gap-1.5"><Avatar user={item.modifiedBy} size={18} />{fmtDate(item.modifiedAt)}</div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

/** Before searching: browse by type. */
function StartState({ types, onType }: { types: DocumentType[]; onType: (t: string) => void }) {
  return (
    <section className="mt-5">
      <h2 className="text-[13px] font-semibold">Browse by type</h2>
      <div className="mt-3 grid grid-cols-4 gap-4">
        {types.map(t => (
          <button key={t.id} onClick={() => onType(t.name)}
            className="group relative overflow-hidden rounded-lg bg-surface p-5 text-left shadow-[0_1px_2px_rgba(2,6,23,0.04)] transition-shadow hover:shadow-md">
            <span className="absolute inset-x-0 top-0 h-1" style={{ background: t.color }} />
            <div className="text-[14px] font-semibold">{t.name}</div>
            <div className="mt-0.5 line-clamp-1 text-[12px] text-muted">{t.description}</div>
            <div className="mt-5 flex items-end justify-between">
              <span><span className="text-[28px] font-bold leading-none tabular-nums">{t.documentCount.toLocaleString()}</span> <span className="text-[12px] text-muted">files</span></span>
              <ArrowRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-teal" />
            </div>
          </button>
        ))}
      </div>
      <p className="mt-6 text-center text-[12.5px] text-muted">Tip: press <kbd className="rounded border border-line bg-surface px-1.5 font-sans">⌘K</kbd> anywhere in H Drive to jump here.</p>
    </section>
  )
}

function Pick({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: (readonly [string, string])[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`h-8 rounded-md border px-2 text-[12.5px] outline-none focus:border-teal ${value ? 'border-teal/50 bg-teal/[0.08] font-medium text-teal-fg' : 'border-line bg-surface'}`}>
      <option value="">{placeholder}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

/** Highlight every occurrence of the term. */
function Mark({ text, term }: { text: string; term: string }) {
  const t = term.trim()
  if (!t) return <>{text}</>
  const parts = text.split(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return <>{parts.map((p, i) => i % 2 ? <mark key={i} className="rounded-[2px] bg-teal/25 px-0.5 text-fg">{p}</mark> : p)}</>
}

/** ~180 chars of text centred on the first match. */
function around(text: string, term: string) {
  const i = text.toLowerCase().indexOf(term.trim().toLowerCase())
  if (i < 0 || text.length <= 180) return text
  const start = Math.max(0, i - 70), end = Math.min(text.length, start + 180)
  return (start ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}
