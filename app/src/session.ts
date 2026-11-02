// Who is signed in. Prototype only: "View as" in the profile menu flips between an admin and a regular member
// so reviewers can see both experiences. Backend: GET /me returns the user and their isAdmin flag.
import { useSyncExternalStore } from 'react'
import { users } from './api'

export type ViewAs = 'admin' | 'member'

// ?viewAs=member|admin in the address wins (handy for sharing a review link), then the saved choice.
let viewAs: ViewAs = (() => {
  const fromUrl = new URLSearchParams(location.search).get('viewAs')
  if (fromUrl === 'member' || fromUrl === 'admin') { try { localStorage.setItem('viewAs', fromUrl) } catch { /* ignore */ } return fromUrl }
  try { return localStorage.getItem('viewAs') === 'member' ? 'member' : 'admin' } catch { return 'admin' }
})()
const listeners = new Set<() => void>()

export function setViewAs(v: ViewAs) {
  viewAs = v
  try { localStorage.setItem('viewAs', v) } catch { /* private mode */ }
  listeners.forEach(l => l())
}

export const useViewAs = () => useSyncExternalStore(cb => { listeners.add(cb); return () => listeners.delete(cb) }, () => viewAs)

/** Admin view signs in as Alok (admin); member view as Priya (Finance, not an admin). */
export const useMe = () => { const v = useViewAs(); return { ...(v === 'admin' ? users[0] : users[1]), isAdmin: v === 'admin' } }

/** Folders the member view can't open (Board Papers), to demo the "no access" page. Backend: 403 on GET /folders/:id. */
export const RESTRICTED_FOR_MEMBERS = ['f5']
