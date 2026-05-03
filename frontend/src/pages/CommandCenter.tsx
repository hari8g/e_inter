import type { LucideIcon } from "lucide-react";
import { Battery, Eye, Gauge, MapPinned, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { FleetMap } from "@/components/FleetMap";
import { PageHeader } from "@/layout/AppShell";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import type { CommandCenterPayload, Vehicle } from "@/types/api";

function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <Icon className="absolute right-4 top-4 h-4 w-4 text-ink-faint" aria-hidden />
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</div>
      <div className="mt-2 text-xs text-ink-muted">{hint}</div>
    </Card>
  );
}

function badgeForStatus(v: Vehicle) {
  if (v.status === "charging") return { text: "CHARGING", cls: "bg-violet-50 text-charge ring-violet-100" };
  if (v.status === "idle") return { text: "IDLE", cls: "bg-amber-50 text-amber-800 ring-amber-100" };
  if (v.status === "offline") return { text: "OFFLINE", cls: "bg-slate-100 text-slate-700 ring-slate-200" };
  return { text: "ACTIVE", cls: "bg-emerald-50 text-live ring-emerald-100" };
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function CommandCenter() {
  const [data, setData] = useState<CommandCenterPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () => {
      api
        .commandCenter()
        .then((d) => {
          if (alive) {
            setData(d);
            setErr(null);
          }
        })
        .catch((e: Error) => alive && setErr(e.message));
    };
    load();
    const t = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (err) {
    return (
      <div>
        <PageHeader title="Command center" description="Live operations for your Bengaluru 2W fleet." />
        <Card className="border-red-200 bg-red-50 text-sm text-red-800">
          <p>
            Could not reach API ({err}). For local dev, start the backend on port 8787 or run{" "}
            <code className="rounded bg-white/80 px-1">npm run dev</code> in <code className="rounded bg-white/80 px-1">backend/</code>
            .
          </p>
          {(err.toLowerCase().includes("pattern") || err.toLowerCase().includes("invalid url")) && (
            <p className="mt-2 text-red-900">
              If you opened the app from disk (<code className="rounded bg-white/80 px-1">file://</code>), use{" "}
              <code className="rounded bg-white/80 px-1">npm run dev</code> in <code className="rounded bg-white/80 px-1">frontend/</code>{" "}
              (or set <code className="rounded bg-white/80 px-1">VITE_API_ORIGIN</code> and rebuild). On Vercel, set{" "}
              <code className="rounded bg-white/80 px-1">VITE_API_ORIGIN</code> to{" "}
              <code className="rounded bg-white/80 px-1">https://your-api.vercel.app</code> (no quotes), then redeploy the
              frontend.
            </p>
          )}
        </Card>
      </div>
    );
  }

  if (!data) {
    return <div className="text-sm text-ink-muted">Loading command centre…</div>;
  }

  const p = data.policy;
  const policyTags = [
    p.showMap ? "Map on" : "Map off",
    p.showAssetStrip ? "Strip on" : "Strip off",
    p.showTripLedger ? "Ledger on" : "Ledger off",
    p.showImmobilise ? "Immobilise UI on" : "Immobilise UI off",
  ];

  const staleList = data.vehicles.filter((v) => {
    const diff = Date.now() - new Date(v.position.lastFixAt).getTime();
    return diff > p.stalePositionMinutes * 60 * 1000;
  });

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        title="Command center"
        description="Live map, KPIs, and asset strip for GPS + CAN electric two-wheelers. Policy drives what operators see."
        actions={
          <>
            <Button variant="ghost" className="text-xs font-semibold uppercase tracking-wide">
              <Eye className="h-4 w-4" />
              Visibility: full
            </Button>
            <Link to="/policy">
              <Button variant="secondary" className="text-xs font-semibold uppercase tracking-wide">
                <Settings className="h-4 w-4" />
                Edit policy
              </Button>
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-brand-border bg-brand-muted/50 px-4 py-3 text-xs text-ink">
        <span className="font-semibold text-brand">Fleet policy → command centre</span>
        <span className="text-ink-muted">·</span>
        {policyTags.map((t) => (
          <span
            key={t}
            className="rounded-full bg-white/80 px-2 py-0.5 font-medium text-ink ring-1 ring-brand-border/60"
          >
            {t}
          </span>
        ))}
        <span className="text-ink-muted">·</span>
        <span>
          GPS interval {p.gpsUplinkTargetSeconds}s · Stale SLA {p.stalePositionMinutes} min · Low SOC band &lt;{" "}
          {p.lowSocAlertPercent}%
        </span>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-muted">
        <span className="font-semibold text-ink">Position freshness</span>
        <span className="text-ink-muted">—</span>
        {staleList.length === 0 ? (
          <span>All assets within freshness SLA.</span>
        ) : (
          <span>
            {staleList.length} asset{staleList.length > 1 ? "s" : ""} past GPS freshness SLA when highlighting is on.
          </span>
        )}
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Fleet (2W)"
          value={String(data.fleetTotal)}
          hint={`${data.reporting} reporting · ${data.noLink} no link`}
          icon={Users}
        />
        <Kpi
          label="Distance today"
          value={`${data.distanceTodayKm} km`}
          hint={`Target ${p.gpsUplinkTargetSeconds}s GPS uplink`}
          icon={MapPinned}
        />
        <Kpi
          label="Avg SOC"
          value={`${data.avgSocPercent}%`}
          hint={`Low SOC band < ${p.lowSocAlertPercent}%`}
          icon={Battery}
        />
        <Kpi
          label="Est. range pool"
          value={`${data.estRangePoolKm} km`}
          hint={`Energy ledger ${data.energyLedgerKwh} kWh (demo)`}
          icon={Gauge}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">{p.showMap ? <FleetMap vehicles={data.vehicles} policy={p} /> : null}</div>
        {p.showAssetStrip ? (
          <div className="space-y-3 xl:col-span-5">
            <div className="text-sm font-semibold text-ink">Live asset strip</div>
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {data.vehicles.map((v) => {
                const b = badgeForStatus(v);
                const low = p.highlightLowSoc && v.socPercent < p.lowSocAlertPercent;
                return (
                  <Card key={v.id} className={`p-4 ${low ? "ring-2 ring-amber-200" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-ink">{v.registration}</div>
                        <div className="text-xs text-ink-muted">{v.displayName}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ${b.cls}`}>
                        {b.text}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-ink-muted">{v.locationLabel}</div>
                    <div className="mt-1 text-[11px] text-ink-faint">Updated {formatTime(v.position.lastFixAt)}</div>
                    {p.showSocStrip ? (
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs text-ink-muted">
                          <span>SOC</span>
                          <span className="font-semibold text-ink">{v.socPercent}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-page">
                          <div
                            className={`h-full rounded-full ${low ? "bg-amber-500" : "bg-brand"}`}
                            style={{ width: `${v.socPercent}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                    {v.telemetryMode === "can_gps" && v.can ? (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-ink-muted">
                        <div className="rounded-lg bg-surface-page px-2 py-1.5">
                          Motor <span className="font-semibold text-ink">{v.can.motorTempC}°C</span>
                        </div>
                        <div className="rounded-lg bg-surface-page px-2 py-1.5">
                          Δcell{" "}
                          <span className="font-semibold text-ink">
                            {Math.round((v.can.maxCellV - v.can.minCellV) * 1000)} mV
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-[11px] text-ink-faint">GPS-only asset — CAN metrics hidden.</div>
                    )}
                    {p.showImmobilise && v.allowImmobilise ? (
                      <div className="mt-3">
                        <Button variant="secondary" className="w-full py-2 text-xs">
                          Immobilise
                        </Button>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
