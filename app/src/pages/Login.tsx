import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, Clock, Loader2, LockKeyhole, ShieldCheck, UserX } from 'lucide-react'

const DOMAIN = 'harbourandhills.com'

// Backend: "Continue with Google" → GET /auth/google (OIDC, hd=harbourandhills.com).
// On failure the callback redirects to /login?error=<code>; codes below map to the messages shown.
const ERRORS = {
  domain: { icon: AlertCircle, title: 'That account isn’t a Harbour & Hills account', body: `Sign in with your @${DOMAIN} Google Workspace email. Personal Gmail accounts can’t access H Drive.` },
  deactivated: { icon: UserX, title: 'Your access has been turned off', body: 'Your H Drive account is deactivated. Contact your administrator if you think this is a mistake.' },
  expired: { icon: Clock, title: 'You were signed out', body: 'Your session expired for security. Sign in again to pick up where you left off.' },
} as const
type ErrorCode = keyof typeof ERRORS

export default function Login() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const error = ERRORS[params.get('error') as ErrorCode]

  const signIn = () => {
    setLoading(true)
    setTimeout(() => navigate('/'), 1200) // ponytail: mock redirect; backend replaces with the Google OAuth flow
  }

  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside className="login-brand relative hidden overflow-hidden p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <ClothDots />
        <DriveUnit />

        <img data-avoid src="/logo-light.svg" alt="H Drive" className="relative h-28 w-28" />

        <div data-avoid className="relative max-w-md">
          <h1 className="text-[40px] font-light leading-[1.1] tracking-tight">
            Every file, folder and decision. <span className="text-teal">One secure home.</span>
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-paper/70">
            The internal document workspace for Harbour &amp; Hills: share with the right people, keep every version and see who did what.
          </p>
          <ul className="mt-8 space-y-3 text-[13px] text-paper/80">
            {[[ShieldCheck, 'Access by role, inherited down every folder'], [LockKeyhole, 'Every action recorded in the audit log']].map(([Icon, t]) => {
              const I = Icon as typeof ShieldCheck
              return <li key={t as string} className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-sm bg-paper/10 text-teal"><I size={14} /></span>{t as string}</li>
            })}
          </ul>
        </div>

        <div data-avoid className="relative w-fit text-[12px] text-paper/50">Harbour &amp; Hills · Internal use only</div>
      </aside>

      {/* Sign-in */}
      <main className="login-form flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-[380px]">
          <img src="/favicon.svg" alt="H Drive" className="h-11 w-11 lg:hidden" />
          <h2 className="mt-6 text-[26px] font-semibold tracking-tight lg:mt-0">Sign in to H Drive</h2>
          <p className="mt-2 text-[14px] text-muted">Use your Harbour &amp; Hills Google Workspace account.</p>

          {error && (
            <div role="alert" className="mt-6 flex gap-3 rounded-md border border-line bg-mist p-4">
              <error.icon size={18} className={`mt-0.5 shrink-0 ${params.get('error') === 'expired' ? 'text-accent' : 'text-red-500'}`} />
              <div>
                <div className="text-[13.5px] font-medium">{error.title}</div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-fg/70">{error.body}</p>
              </div>
            </div>
          )}

          <button onClick={signIn} disabled={loading}
            className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-md border border-line bg-surface text-[14px] font-medium shadow-sm transition-colors hover:border-accent/40 hover:bg-mist disabled:cursor-wait disabled:opacity-80">
            {loading ? <Loader2 size={18} className="animate-spin text-accent" /> : <GoogleG />}
            {loading ? 'Signing you in…' : 'Continue with Google'}
          </button>

          <p className="mt-4 text-center text-[12px] text-muted">Only <span className="font-medium text-fg/80">@{DOMAIN}</span> accounts can sign in.</p>

          <div className="mt-10 border-t border-line pt-6 text-[12px] leading-relaxed text-muted">
            Trouble signing in? Contact <a href={`mailto:it@${DOMAIN}`} className="font-medium text-accent hover:underline">it@{DOMAIN}</a>
          </div>
        </div>
      </main>
    </div>
  )
}

// Google "G" mark (multicolour, per Google sign-in branding guidelines)
const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

/**
 * "Ball under a cloth": one soft bump wanders randomly beneath the dot grid.
 * Dots over it lift (grow, push slightly outward) and glow teal with a gentle neon pulse.
 * It steers clear of anything marked [data-avoid] (logo, copy, drive illustration), and dots
 * behind those never light up. Canvas, DPR-aware. Reduced motion → one static frame.
 */
function ClothDots() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!, ctx = canvas.getContext('2d')!
    const GAP = 18, SIGMA = 65, KEEP_OUT = 150, SPEED = 0.9  // px, px, px, px/frame
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0, h = 0, raf = 0
    let zones: { l: number; t: number; r: number; b: number }[] = []
    const measure = () => {
      const dpr = devicePixelRatio || 1
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const c = canvas.getBoundingClientRect()
      zones = [...canvas.parentElement!.querySelectorAll('[data-avoid]')].map(el => {
        const r = el.getBoundingClientRect()
        return { l: r.left - c.left, t: r.top - c.top, r: r.right - c.left, b: r.bottom - c.top }
      })
    }
    const ro = new ResizeObserver(measure); ro.observe(canvas); measure()

    // distance from point to a zone (0 inside) and the push-away direction
    const away = (x: number, y: number, z: typeof zones[number]) => {
      const nx = Math.max(z.l, Math.min(x, z.r)), ny = Math.max(z.t, Math.min(y, z.b))
      const dx = x - nx, dy = y - ny, d = Math.hypot(dx, dy)
      if (d === 0) { const cx = (z.l + z.r) / 2, cy = (z.t + z.b) / 2, e = Math.hypot(x - cx, y - cy) || 1; return { d, ux: (x - cx) / e, uy: (y - cy) / e } }
      return { d, ux: dx / d, uy: dy / d }
    }
    const inZone = (x: number, y: number) => zones.some(z => x > z.l - 6 && x < z.r + 6 && y > z.t - 6 && y < z.b + 6)

    // start the ball in the open space with the most clearance
    let bx = w * 0.75, by = h * 0.35
    for (let k = 0; k < 40; k++) {
      const x = w * (0.1 + Math.random() * 0.8), y = h * (0.1 + Math.random() * 0.8)
      if (Math.min(...zones.map(z => away(x, y, z).d), Infinity) > KEEP_OUT) { bx = x; by = y; break }
    }
    let a = Math.random() * Math.PI * 2, vx = Math.cos(a) * SPEED, vy = Math.sin(a) * SPEED

    const frame = (t: number) => {
      // wander + steering: random drift, pushed off zones and panel edges
      a = (Math.random() - 0.5) * 0.15
      let fx = vx * Math.cos(a) - vy * Math.sin(a), fy = vx * Math.sin(a) + vy * Math.cos(a)
      for (const z of zones) {
        const { d, ux, uy } = away(bx, by, z)
        if (d < KEEP_OUT) { const f = (1 - d / KEEP_OUT) * 0.6; fx += ux * f; fy += uy * f }
      }
      const edge = 80
      if (bx < edge) fx += (1 - bx / edge) * 0.6; if (bx > w - edge) fx -= (1 - (w - bx) / edge) * 0.6
      if (by < edge) fy += (1 - by / edge) * 0.6; if (by > h - edge) fy -= (1 - (h - by) / edge) * 0.6
      const m = Math.hypot(fx, fy) || 1
      vx = (fx / m) * SPEED; vy = (fy / m) * SPEED
      bx += vx; by += vy

      ctx.clearRect(0, 0, w, h)
      const pulse = 0.75 + 0.25 * Math.sin(t * 0.004)     // subtle neon breathing
      for (let gy = GAP / 2; gy < h; gy += GAP) {
        for (let gx = GAP / 2; gx < w; gx += GAP) {
          const ox = gx - bx, oy = gy - by, d2 = ox * ox + oy * oy
          let lift = Math.exp(-d2 / (2 * SIGMA * SIGMA))
          if (lift > 0.04 && inZone(gx, gy)) lift = 0      // never glow behind text / illustration
          const d = Math.sqrt(d2) || 1
          const x = gx + (ox / d) * lift * 3, y = gy + (oy / d) * lift * 3   // cloth stretches outward
          if (lift > 0.04) {
            const g = lift * pulse
            ctx.shadowBlur = 10 * g; ctx.shadowColor = 'rgba(0,191,179,0.95)'
            ctx.fillStyle = `rgba(${Math.round(255 - 135 * lift)},${Math.round(255 - 8 * lift)},${Math.round(255 - 15 * lift)},${0.14 + 0.82 * g})`
            ctx.beginPath(); ctx.arc(x, y, 1 + 1.3 * lift, 0, 7); ctx.fill()
            ctx.shadowBlur = 0
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.14)'
            ctx.fillRect(x - 1, y - 1, 2, 2)
          }
        }
      }
      if (!still) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
}

/**
 * Bottom-right illustration: a line-art storage unit with three bays. File packets travel
 * along a line into the unit; each bay's LED flickers teal as its packet lands. Pure SVG + CSS.
 */
function DriveUnit() {
  const bays = [0, 1, 2]
  return (
    <svg data-avoid viewBox="0 0 300 170" aria-hidden className="drive-unit pointer-events-none absolute bottom-10 right-10 w-[300px]">
      <style>{`
        .drive-unit .led { animation: drive-led 4.5s ease-out infinite; }
        .drive-unit .bar { animation: drive-bar 4.5s ease-in-out infinite; transform-box: fill-box; transform-origin: left; }
        @keyframes drive-led { 0%, 52% { fill: rgba(255,255,255,.45); filter: none } 58% { fill: #7af7ee; filter: drop-shadow(0 0 4px #00bfb3) } 66% { fill: rgba(255,255,255,.45) } 72% { fill: #7af7ee; filter: drop-shadow(0 0 4px #00bfb3) } 85%, 100% { fill: rgba(255,255,255,.45); filter: none } }
        @keyframes drive-bar { 0%, 55% { transform: scaleX(.3) } 75% { transform: scaleX(.85) } 100% { transform: scaleX(.3) } }
        @media (prefers-reduced-motion: reduce) { .drive-unit * { animation: none !important } }
      `}</style>

      {/* incoming data lines + packets */}
      {bays.map(i => {
        const y = 62 + i * 30, path = `M0 ${y - 30 + i * 12} C 50 ${y - 30 + i * 12}, 60 ${y}, 118 ${y}`
        return (
          <g key={i}>
            <path d={path} fill="none" stroke="rgba(255,255,255,.35)" strokeDasharray="2 4" />
            <rect x="-4.5" y="-5.5" width="9" height="11" rx="1.5" fill="none" stroke="#7af7ee" strokeWidth="1.2" opacity="0">
              <animateMotion dur="4.5s" begin={`${i * 1.5}s`} repeatCount="indefinite" path={path}
                keyPoints="0;1;1" keyTimes="0;0.55;1" calcMode="spline" keySplines=".5 0 .3 1;0 0 1 1" />
              <animate attributeName="opacity" dur="4.5s" begin={`${i * 1.5}s`} repeatCount="indefinite"
                values="0;1;1;0;0" keyTimes="0;0.08;0.52;0.58;1" />
            </rect>
          </g>
        )
      })}

      {/* enclosure */}
      <rect x="120" y="30" width="170" height="120" rx="8" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.7)" />
      <rect x="128" y="38" width="154" height="10" rx="2" fill="none" stroke="rgba(255,255,255,.4)" />
      <text x="134" y="46" fontSize="6" letterSpacing="1.5" fill="rgba(255,255,255,.7)" fontFamily="Inter, sans-serif">H DRIVE · NODE 01</text>

      {/* bays */}
      {bays.map(i => {
        const y = 54 + i * 30
        return (
          <g key={i}>
            <rect x="128" y={y} width="154" height="24" rx="3" fill="rgba(255,255,255,.03)" stroke="rgba(255,255,255,.55)" />
            {[0, 1, 2, 3, 4, 5].map(j => <line key={j} x1={140 + j * 6} y1={y + 7} x2={140 + j * 6} y2={y + 17} stroke="rgba(255,255,255,.35)" />)}
            <rect x="186" y={y + 10} width="70" height="3" rx="1.5" fill="rgba(255,255,255,.15)" />
            <rect className="bar" x="186" y={y + 10} width="70" height="3" rx="1.5" fill="rgba(0,191,179,.55)" style={{ animationDelay: `${i * 1.5}s` }} />
            <circle className="led" cx="270" cy={y + 12} r="3" fill="rgba(255,255,255,.45)" style={{ animationDelay: `${i * 1.5}s` }} />
          </g>
        )
      })}

      {/* feet */}
      <rect x="138" y="150" width="20" height="4" rx="2" fill="rgba(255,255,255,.4)" />
      <rect x="252" y="150" width="20" height="4" rx="2" fill="rgba(255,255,255,.4)" />
    </svg>
  )
}
