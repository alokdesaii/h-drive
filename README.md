<div align="center">

<img src="docs/logo.svg" alt="H Drive" width="120" />

# H Drive

**Harbour & Hills' internal document workspace: one secure home for every file, folder and decision.**

[Live preview](https://h-drive.vercel.app) · [Member view](https://h-drive.vercel.app/dashboard?viewAs=member) · [Conceptual model](docs/model.md) · [API contract](app/src/types.ts)

![React](https://img.shields.io/badge/React-19-023e63?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-023e63?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-00bfb3?style=flat-square&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-00bfb3?style=flat-square&logo=vite&logoColor=white)
![Status](https://img.shields.io/badge/status-design%20review-94a3b8?style=flat-square)

</div>

---

> [!NOTE]
> **This is a frontend design prototype.** Every screen runs on sample data so it can be reviewed and approved before the backend team wires it up. Actions (upload, share, move, approve…) work on screen but nothing is saved: a refresh resets everything.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screens/dashboard-dark.png" />
  <img src="docs/screens/dashboard.png" alt="Admin dashboard" />
</picture>

## Screens

| | |
|---|---|
| <img src="docs/screens/login.png" alt="Sign in" /> | <img src="docs/screens/documents.png" alt="Documents with details panel" /> |
| **Sign in:** Google Workspace only (`@harbourandhills.com`), with clear messages for the wrong account, a deactivated account or an expired session. | **Documents:** folders, type filters, list/grid, bulk actions, drag-and-drop upload, and a details panel (properties, versions, access, activity). |
| <img src="docs/screens/search.png" alt="Search" /> | <img src="docs/screens/alerts.png" alt="Alerts" /> |
| **Search:** file names, folder names and the text inside documents, with filters, highlighted matches and shareable search links. Press ⌘K anywhere. | **Alerts:** updates on what you follow, grouped by day, with unread state and "because you follow…" on every alert. |
| <img src="docs/screens/manage-alerts.png" alt="Manage alerts" /> | <img src="docs/screens/trash.png" alt="Trash" /> |
| **Manage alerts:** email timing, and per-folder choice of which events to hear about. | **Trash:** restore within 30 days, a countdown per item, and a confirmation before anything is deleted forever. **Archived** works the same way. |

### Admin

| | |
|---|---|
| <img src="docs/screens/users.png" alt="Users" /> | <img src="docs/screens/access.png" alt="Access" /> |
| **Users:** invite (domain-checked), make admin, deactivate (with file hand-over), resend or revoke invites. | **Access:** folder tree, share by email with a role, inherited access and a role guide. |
| <img src="docs/screens/settings.png" alt="Settings" /> | <img src="docs/screens/audit.png" alt="Audit log" /> |
| **Settings:** workspace, sharing, document types, review stages, storage & retention, notifications. Nothing changes until you press Save. | **Audit log:** every action, filterable and exportable. |

### Regular staff (member view) and error pages

| | |
|---|---|
| <img src="docs/screens/my-dashboard.png" alt="Member dashboard" /> | <img src="docs/screens/no-access.png" alt="No access" /> |
| **Member Dashboard:** recent files, files waiting for your review, files shared with you and latest alerts. No Admin section in the sidebar. | **No access:** shown for a restricted folder, with the owner and a **Request access** form. There's also **404 Page not found** and **This page is for admins**. |

> [!TIP]
> **Preview as an admin or a member:** use **View as** in the profile menu (top right), or add `?viewAs=member` / `?viewAs=admin` to any link. This switch exists only in the prototype; in the real app the role comes from sign-in.

### Dark mode

Light, Dark or System (default), from the switch in the top bar.

| | |
|---|---|
| <img src="docs/screens/dashboard-dark.png" alt="Dashboard, dark" /> | <img src="docs/screens/documents-dark.png" alt="Documents, dark" /> |
| <img src="docs/screens/search-dark.png" alt="Search, dark" /> | <img src="docs/screens/alerts-dark.png" alt="Alerts, dark" /> |
| <img src="docs/screens/users-dark.png" alt="Users, dark" /> | <img src="docs/screens/login-dark.png" alt="Sign in, dark" /> |

## Sitemap

| Page | Address | Status |
|---|---|---|
| Sign in | `/` · `/login` · `/login?error=domain\|deactivated\|expired` | ✅ |
| Dashboard (admin / member) | `/dashboard` | ✅ |
| Documents · folder · details panel | `/documents` · `/documents/:folder` · `?item=:id` | ✅ |
| Search | `/search?q=&type=&status=&folder=&within=&sort=` | ✅ |
| Archived · Trash | `/archived` · `/trash` | ✅ |
| Alerts · Manage alerts | `/alerts` · `/alerts/manage` | ✅ |
| Access · Users · Audit log (admin) | `/access` · `/users` · `/audit` | ✅ |
| Settings (admin) | `/settings?section=general\|sharing\|types\|review\|retention\|notifications` | ✅ |
| Pop-ups: New folder, Upload + progress, Share, Move, Rename, Trash, Archive, Invite, Deactivate, Document types | (inside the pages above) | ✅ |
| Errors: 404, admins only, no access + request | any unknown address · admin page as member · restricted folder | ✅ |
| Full-page document view ("Open") | | ⏳ Not designed |

## Design language

| Token | Hex | Role |
|---|---|---|
| ![](https://placehold.co/14x14/023e63/023e63.png) Navy | `#023e63` | Sidebar, banners, primary actions |
| ![](https://placehold.co/14x14/00bfb3/00bfb3.png) Teal | `#00bfb3` | Highlights, selection, focus, positive change |
| ![](https://placehold.co/14x14/020617/020617.png) Ink | `#020617` | Primary text |
| ![](https://placehold.co/14x14/94a3b8/94a3b8.png) Slate | `#94a3b8` | Secondary text, icons |
| ![](https://placehold.co/14x14/f1f5f9/f1f5f9.png) Mist | `#f1f5f9` | Canvas, subtle fills |

- **Pattern:** grey canvas, white cards, and a navy `brand-banner` header (fine dot grid + teal glow) with one big bold figure
- **Themes:** light + dark from one set of colour roles (`surface`, `fg`, `accent`…) in [`index.css`](app/src/index.css)
- **Type:** Inter; big bold numbers for key figures
- **Corners:** 4 / 6 / 10px scale, set in [`index.css`](app/src/index.css)
- **Vocabulary:** one word per concept (*Upload*, *Share*, *Access*, *Move to trash*), defined in [`docs/model.md`](docs/model.md)

## For the backend team

Screens never fetch data themselves. They call functions in **[`api.ts`](app/src/api.ts)**, so integrating means replacing those mock bodies; no screen should need to change.

```
app/src/
├── types.ts        ← the data contract: Folder, Document, Member, Notification, Subscription, WorkspaceSettings…
├── api.ts          ← one function per endpoint, each with its method + URL in a comment; replace the mock bodies
├── fileActions.tsx ← all file pop-ups; the write endpoints are listed at the top
├── session.ts      ← who's signed in (GET /me) and the prototype-only "View as" switch
├── mock.ts         ← sample Harbour & Hills data
├── ui.tsx          ← shared pieces: Button, Menu, Dialog, Avatar, StatusBadge, toast…
└── pages/          ← one file per screen
```

<details>
<summary><b>Endpoints the screens expect</b></summary>

```
Auth & me        GET /auth/google · POST /auth/logout · GET /me · GET /me/home
Documents        GET /folders · GET /folders/:id/items · GET /folders/:id/path
                 POST /folders · POST /uploads · PATCH /items/:id · POST /items/:id/archive · POST /items/:id/trash
                 GET /documents/:id/versions · POST /documents/:id/review
Access           GET /items/:id/access · POST /items/:id/share · POST /items/:id/access-requests
Search           GET /search?q=&type=&status=&folder=&within=&sort= · GET /search/recent
Archived/Trash   GET /archived · GET /trash · POST /items/:id/restore · DELETE /items/:id · DELETE /trash
Alerts           GET /me/notifications · POST /me/notifications/read · GET|POST|PATCH|DELETE /me/subscriptions
                 GET|PATCH /me/alert-prefs
Admin            GET /admin/dashboard?range= · GET /admin/users · POST /admin/users/invite · PATCH /admin/users/:id
                 GET|PATCH /admin/settings · GET|POST|PATCH|DELETE /document-types
                 GET /audit?action=&entity=&userId=&q=&page=&pageSize= · GET /audit/export
```
</details>

The objects, roles, document lifecycle and open questions are in **[`docs/model.md`](docs/model.md)**. Please read it before designing the schema.

## Run locally

```bash
cd app
npm install
npm run dev     # http://localhost:5173
```

Pushing to `main` deploys to [h-drive.vercel.app](https://h-drive.vercel.app) automatically.

<div align="center">
<sub>Built for Harbour &amp; Hills · Internal use only</sub>
</div>
