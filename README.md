# e-inter

**Repository:** [github.com/hari8g/e_inter](https://github.com/hari8g/e_inter)

**e-inter** is an intermediate electric-fleet SaaS demo: everything you would expect from a lightweight **GPS telematics** command centre (in the spirit of **e-lite**), plus **CAN-aware** signals, **battery health** analytics with deterioration attribution, **asset lifecycle** planning (odometer, major-service dates, heuristics), **driver classification**, and **maintenance** hooks.

The repo is split into **`frontend/`** (React + Vite + Tailwind + Recharts + Leaflet) and **`backend/`** (Express + TypeScript, in-memory demo fleet).

## Features

| Area | Notes |
|------|--------|
| **Command centre** | KPIs, policy strip, OSM map, live asset strip; CAN extras when the vehicle is `can_gps`. |
| **Register vehicle** | GPS-only vs **CAN + GPS** telematics mode. |
| **GPS / gateway devices** | Register units, pair/unpair semantics on the server. |
| **Maintenance** | Work list + predictive-style work types. |
| **Fleet policy** | Visibility toggles and thresholds; `PUT` applies immediately. |
| **Battery health** | SOH history/forecast, imbalance risk, **fade attribution** (calendar / cyclic / Δcell / thermal), heuristic indices, fleet charts. |
| **Asset lifecycle** | Odometer-forward cards, **next major service date**, wear curve, RUL-style fields, heuristic flags. |
| **Driver classification** | Radar + safety trajectory (demo drivers). |
| **CAN telemetry** | Live-style BMS aggregates for CAN assets. |

## Requirements

- **Node.js** 20+ (LTS recommended)
- **npm** 9+

## Quick start

Run **backend** and **frontend** in two terminals from the repo root.

### Backend (API on port `8787`)

```bash
cd backend
npm install
npm run dev
```

### Frontend (Vite on port `5173`, proxies `/api` → backend)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in the browser.

### Production builds

```bash
cd backend && npm run build && npm start
cd frontend && npm run build && npm run preview
```

For production you will normally set `VITE_*` or serve the SPA behind the same host as the API; in development the Vite proxy handles `/api/v1/*`.

## Deploying on Vercel

Use **two Vercel projects** from the same GitHub repo ([hari8g/e_inter](https://github.com/hari8g/e_inter)): one for the **API** and one for the **SPA**. The UI calls the API using `VITE_API_ORIGIN` (see [Environment variables](https://vercel.com/docs/projects/environment-variables)).

### Important: serverless vs in-memory data

The API keeps fleet state **in memory**. On Vercel, **each serverless invocation can use a fresh instance**, so data may **reset** on cold starts and does not behave like a single long-lived server. This is fine for demos; production fleets should use a **database** and/or a **container** host (e.g. Fly.io, Railway, Render) for a stable Node process.

### 1) Backend (Express) project

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New…** → **Project** → import `hari8g/e_inter`.
2. **Root Directory:** `backend` (monorepo subfolder).
3. **Framework Preset:** Other (no framework), or let Vercel auto-detect.
4. **Build Command:** leave default or use `npm run build` (optional typecheck / `dist` for local `npm start`; Vercel runs the `api/` entry from source).
5. **Output Directory:** leave empty (not a static site).
6. Deploy. Note the production URL, e.g. `https://e-inter-api.vercel.app`.

The repo includes:

- `backend/api/index.ts` — serverless entry that exports the Express `app` ([Express on Vercel](https://vercel.com/docs/frameworks/backend/express)).
- `backend/vercel.json` — rewrites all routes to that function so `/api/v1/*` and `/` hit Express.

### 2) Frontend (Vite) project

1. **Add New Project** again (second project), same repo.
2. **Root Directory:** `frontend`.
3. **Framework Preset:** Vite (or Other with **Build Command** `npm run build` and **Output Directory** `dist`).
4. Under **Environment Variables**, add:

   | Name | Value | Environments |
   |------|--------|----------------|
   | `VITE_API_ORIGIN` | `https://<your-backend>.vercel.app` | Production (and Preview if you want previews to call a preview API) |

   No trailing slash. Example: `https://e-inter-api.vercel.app`.

5. Deploy. Open the frontend URL; the app will call `VITE_API_ORIGIN/api/v1/...`.

Local dev is unchanged: leave `VITE_API_ORIGIN` unset so requests use `/api/v1` and the Vite dev proxy (`frontend/vite.config.ts`).

### 3) CORS

The API uses `cors({ origin: true })`, so browser calls from your Vercel frontend domain are allowed for this demo.

### 4) Optional: `vercel dev`

From `backend/` or `frontend/`, run `npx vercel dev` to emulate Vercel locally ([docs](https://vercel.com/docs/cli)).

## API overview

Base path: **`/api/v1`**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness / product id. |
| `GET` | `/command-center` | Aggregated fleet + vehicles + policy. |
| `GET`/`PUT` | `/policy` | Read/update fleet policy. |
| `GET`/`POST` | `/vehicles` | List / register vehicles. |
| `GET`/`POST` | `/devices` | List / register devices; `POST /devices/:id/unpair`. |
| `GET`/`POST`/`PATCH` | `/maintenance` | List, create, update status. |
| `GET` | `/analytics/battery-health` | Battery points + history/forecast/heuristics. |
| `GET` | `/analytics/asset-lifecycle` | Lifecycle stages + heuristics. |
| `GET` | `/analytics/driver-classification` | Driver scores. |
| `GET` | `/can/snapshot` | CAN snapshots for CAN-enabled vehicles. |

## Project layout

```
e-inter/
├── backend/           # Express API, seed data, prognosis enrichment
│   ├── api/           # Vercel serverless entry (exports Express app)
│   ├── src/
│   └── package.json
├── frontend/          # React SPA
│   ├── src/
│   └── package.json
└── README.md
```

## Tech stack

- **Frontend:** React 18, TypeScript, Vite 6, Tailwind CSS, React Router, Leaflet / react-leaflet, Recharts, Lucide icons.
- **Backend:** Express 4, TypeScript, Zod (validation), in-memory store with periodic CAN noise for demos.

## License

Demo / educational use unless you attach your own license.

---

## Publishing to GitHub

After creating an empty repository on GitHub (for example `e-inter`), run:

```bash
cd /path/to/e-inter
git init
git add .
git commit -m "Initial commit: e-inter fleet SaaS (frontend + backend)"
git branch -M main
git remote add origin https://github.com/<YOUR_USER>/e-inter.git
git push -u origin main
```

If you use SSH:

```bash
git remote add origin git@github.com:<YOUR_USER>/e-inter.git
git push -u origin main
```

With the [GitHub CLI](https://cli.github.com/) (`gh`), from the repo root:

```bash
gh repo create e-inter --public --source=. --remote=origin --push
```
