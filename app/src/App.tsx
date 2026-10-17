import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  Archive, Bell, BellRing, ChevronDown, ChevronsLeft, LogOut, Folder, LayoutDashboard, Monitor, Moon, ScrollText,
  Search, Settings, ShieldCheck, Sun, Trash2, Users,
} from 'lucide-react'
import Documents from './pages/Documents'
import AccessPage from './pages/AccessPage'
import AuditPage from './pages/AuditPage'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import { Menu, MenuDivider, MenuItem } from './ui'

const nav = [
  { group: null, items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/documents', label: 'Documents', icon: Folder },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/archived', label: 'Archived', icon: Archive },
    { to: '/trash', label: 'Trash', icon: Trash2 },
  ]},
  { group: 'Alerts', items: [
    { to: '/alerts', label: 'Alerts', icon: Bell, badge: 3 },
    { to: '/alerts/manage', label: 'Manage alerts', icon: BellRing },
  ]},
  { group: 'Admin', items: [
    { to: '/access', label: 'Access', icon: ShieldCheck },
    { to: '/users', label: 'Users', icon: Users },
    { to: '/audit', label: 'Audit log', icon: ScrollText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]},
]
const allItems = nav.flatMap(g => g.items)

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={`${collapsed ? 'w-[68px]' : 'w-60'} shrink-0 bg-navy text-paper flex flex-col transition-[width] duration-200`}>
      <div className="h-16 flex items-center gap-2.5 px-5">
        <img src="/mark-light.svg" alt="" className="h-6 w-6 shrink-0" />
        {!collapsed && <span className="font-semibold tracking-tight text-[15px]">H Drive</span>}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {nav.map((g, i) => (
          <div key={i}>
            {g.group && !collapsed && (
              <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-paper/45">{g.group}</div>
            )}
            <ul className="space-y-0.5">
              {g.items.map(({ to, label, icon: Icon, ...rest }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/' || to === '/alerts'}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-md px-2.5 h-9 text-[13.5px] transition-colors ${
                        isActive ? 'bg-paper/12 text-paper font-medium' : 'text-paper/70 hover:bg-paper/6 hover:text-paper'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r bg-teal" />}
                        <Icon size={17} strokeWidth={1.75} className={`shrink-0 ${isActive ? 'text-teal' : ''}`} />
                        {!collapsed && <span className="flex-1">{label}</span>}
                        {!collapsed && 'badge' in rest && (
                          <span className={`text-[11px] font-medium rounded-sm px-1.5 min-w-5 text-center ${isActive ? 'bg-teal text-night' : 'bg-teal/20 text-teal'}`}>
                            {rest.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-paper/10 p-3">
        {!collapsed && (
          <div className="mb-3 rounded-md bg-paper/6 px-3 py-2.5">
            <div className="flex justify-between text-[12px]"><span className="text-paper/60">Storage</span><span className="font-medium">412 / 1,000 GB</span></div>
            <div className="mt-2 h-1 rounded-[1px] bg-paper/15"><div className="h-1 w-[41%] rounded-[1px] bg-teal" /></div>
          </div>
        )}
        <button onClick={onToggle} className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[13px] text-paper/50 hover:bg-paper/6 hover:text-paper">
          <ChevronsLeft size={16} className={collapsed ? 'rotate-180' : ''} />
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  )
}

// Light / dark / system. Choice is a per-browser convenience, so localStorage is fine (guarded: it can throw).
type Theme = 'light' | 'dark' | 'system'
const THEMES: [Theme, typeof Sun, string][] = [['light', Sun, 'Light'], ['dark', Moon, 'Dark'], ['system', Monitor, 'System']]
function applyTheme(t: Theme) {
  if (t === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.dataset.theme = t
}
function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    try { return (localStorage.getItem('theme') as Theme) || 'system' } catch { return 'system' }
  })
  useEffect(() => {
    applyTheme(theme)
    try { localStorage.setItem('theme', theme) } catch { /* private mode */ }
  }, [theme])
  return (
    <div className="flex rounded-md border border-line p-0.5" role="radiogroup" aria-label="Theme">
      {THEMES.map(([t, Icon, label]) => (
        <button key={t} role="radio" aria-checked={theme === t} aria-label={label} title={label} onClick={() => setTheme(t)}
          className={`grid h-7 w-7 place-items-center rounded-sm ${theme === t ? 'bg-mist text-accent' : 'text-muted hover:text-fg'}`}>
          <Icon size={14} strokeWidth={1.75} />
        </button>
      ))}
    </div>
  )
}

function Topbar() {
  const navigate = useNavigate()
  return (
    <header className="h-16 shrink-0 border-b border-line flex items-center gap-4 px-8">
      <button className="flex h-9 w-full max-w-md items-center gap-2.5 rounded-md border border-line bg-surface px-3 text-[13px] text-muted hover:border-muted/60">
        <Search size={15} />
        <span className="flex-1 text-left">Search files, folders, people…</span>
        <kbd className="rounded border border-line px-1.5 text-[11px] font-sans">⌘K</kbd>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <button className="relative grid h-9 w-9 place-items-center rounded-md text-fg/70 hover:bg-mist" aria-label="Alerts">
          <Bell size={17} strokeWidth={1.75} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-teal" />
        </button>
        <div className="mx-2 h-6 w-px bg-line" />
        <Menu trigger={
          <button className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 hover:bg-mist">
            <span className="grid h-8 w-8 place-items-center rounded-sm bg-navy text-[12px] font-medium text-paper">AD</span>
            <span className="text-left leading-tight">
              <span className="block text-[13px] font-medium">Alok Desai</span>
              <span className="block text-[11px] text-muted">Administrator</span>
            </span>
            <ChevronDown size={14} className="text-muted" />
          </button>
        }>
          <div className="px-2.5 py-2 text-[12px] text-muted">alok.desai@harbourandhills.com</div>
          <MenuDivider />
          {/* Backend: POST /auth/logout, then redirect here */}
          <MenuItem icon={LogOut} onClick={() => navigate('/login')}>Sign out</MenuItem>
        </Menu>
      </div>
    </header>
  )
}

// ponytail: placeholder until each screen is built
function Placeholder() {
  const { pathname } = useLocation()
  const item = allItems.find(i => i.to === pathname)
  return (
    <div className="px-8 py-8">
      <h1 className="text-[22px] font-semibold tracking-tight">{item?.label ?? 'Not found'}</h1>
      <p className="mt-1 text-[13px] text-muted">Screen coming in the next step.</p>
      <div className="mt-8 grid h-64 place-items-center rounded-lg border border-dashed border-line text-[13px] text-muted">
        {item?.label}
      </div>
    </div>
  )
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  // Sign-in page sits outside the app shell. ponytail: no auth guard yet, the backend adds the redirect for signed-out users.
  if (useLocation().pathname === '/login') return <Login />
  return (
    <div className="flex h-full">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/documents/:folderId?" element={<Documents />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/access" element={<AccessPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="*" element={<Placeholder />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
