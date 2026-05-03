# e-inter

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
