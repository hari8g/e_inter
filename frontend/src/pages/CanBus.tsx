import { Cpu } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/api/client";
import { chart, cartesianGrid, axisProps, tooltipProps } from "@/lib/chartTheme";
import { PageHeader } from "@/layout/AppShell";
import { Callout } from "@/ui/Callout";
import { Card } from "@/ui/Card";
import type { CanSnapshot } from "@/types/api";

type Row = { vehicleId: string; registration: string; snapshot: CanSnapshot };

const cellColor = (mv: number) => {
  if (mv > 90) return chart.danger;
  if (mv > 55) return chart.warn;
  return chart.brand;
};

export default function CanBus() {
  const [rows, setRows] = useState<Row[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    let alive = true;
    const load = () =>
      api.canSnapshot().then((r) => {
        if (!alive) return;
        setRows(r.items);
        setUpdatedAt(r.updatedAt);
      });
    load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const compare = useMemo(
    () =>
      rows.map((r) => {
        const dMv = Math.round((r.snapshot.maxCellV - r.snapshot.minCellV) * 1000);
        return {
          reg: r.registration.length > 12 ? `${r.registration.slice(0, 11)}…` : r.registration,
          bms: r.snapshot.bmsHealthScore,
          motor: r.snapshot.motorTempC,
          deltaMv: dMv,
        };
      }),
    [rows],
  );

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        title="CAN bus intelligence"
        description="Comparative charts stress-test the fleet at a glance; per-asset tiles retain live numerics. Use Δcell mV heat as an early proxy for balancing workload until EIS is scheduled."
      />
      <Callout icon={Cpu}>
        Demo stream synthesises motor temperature, pack voltage, min/max cell spread, and BMS health score every few
        seconds. Wire your ingest worker to replace the simulator when gateways land in production.
      </Callout>
      <div className="mb-6 text-xs text-ink-muted">
        Stream clock{" "}
        {updatedAt
          ? new Intl.DateTimeFormat("en-IN", { timeStyle: "medium" }).format(new Date(updatedAt))
          : "—"}
      </div>

      {compare.length > 0 ? (
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">BMS health score · fleet compare</h2>
            <p className="mb-4 text-xs text-ink-muted">Higher is better — watch sustained drops week-over-week.</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compare} margin={{ left: 0, right: 8, top: 8, bottom: 40 }}>
                  <CartesianGrid {...cartesianGrid} />
                  <XAxis dataKey="reg" {...axisProps} interval={0} angle={-20} textAnchor="end" height={56} />
                  <YAxis domain={[60, 100]} {...axisProps} width={28} />
                  <Tooltip {...tooltipProps} />
                  <Bar dataKey="bms" name="BMS health" radius={[6, 6, 0, 0]}>
                    {compare.map((e, i) => (
                      <Cell key={e.reg + i} fill={e.bms < 82 ? chart.warn : chart.brand} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Motor temperature vs cell spread</h2>
            <p className="mb-4 text-xs text-ink-muted">Thermal load correlated with Δcell — investigate outliers first.</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={compare} margin={{ left: 0, right: 8, top: 8, bottom: 40 }}>
                  <CartesianGrid {...cartesianGrid} />
                  <XAxis dataKey="reg" {...axisProps} interval={0} angle={-20} textAnchor="end" height={56} />
                  <YAxis yAxisId="l" {...axisProps} width={28} domain={[25, 55]} />
                  <YAxis yAxisId="r" orientation="right" {...axisProps} width={36} domain={[0, 140]} />
                  <Tooltip {...tooltipProps} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line yAxisId="l" type="monotone" dataKey="motor" name="Motor °C" stroke={chart.accent} strokeWidth={2} dot />
                  <Line yAxisId="r" type="monotone" dataKey="deltaMv" name="Δcell mV" stroke={chart.warn} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {rows.map((r) => {
          const dMv = Math.round((r.snapshot.maxCellV - r.snapshot.minCellV) * 1000);
          const mini = [
            { k: "BMS", v: r.snapshot.bmsHealthScore },
            { k: "Motor", v: r.snapshot.motorTempC * 2 },
            { k: "ΔmV", v: Math.min(100, dMv) },
          ];
          return (
            <Card key={r.vehicleId} className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase text-ink-muted">Vehicle</div>
                  <div className="text-xl font-semibold text-brand">{r.registration}</div>
                </div>
                <span className="rounded-full bg-brand-muted px-2 py-1 text-[10px] font-bold uppercase text-brand ring-1 ring-brand-border">
                  CAN+GPS
                </span>
              </div>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mini} layout="vertical" margin={{ left: 48, right: 16, top: 4, bottom: 4 }}>
                    <CartesianGrid {...cartesianGrid} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="k" width={44} {...axisProps} />
                    <Bar dataKey="v" radius={[0, 4, 4, 0]}>
                      {mini.map((m, i) => (
                        <Cell key={m.k + i} fill={m.k === "ΔmV" ? cellColor(dMv) : chart.brand} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Metric label="Motor °C" value={String(r.snapshot.motorTempC)} />
                <Metric label="Pack V" value={r.snapshot.packVoltageV.toFixed(1)} />
                <Metric label="Min cell" value={r.snapshot.minCellV.toFixed(2)} />
                <Metric label="Max cell" value={r.snapshot.maxCellV.toFixed(2)} />
                <Metric label="Δ cell" value={`${dMv} mV`} warn={dMv > 70} />
                <Metric label="BMS health" value={`${r.snapshot.bmsHealthScore}`} accent />
              </div>
              <div className="text-[11px] text-ink-faint">
                Captured{" "}
                {new Intl.DateTimeFormat("en-IN", { timeStyle: "medium" }).format(new Date(r.snapshot.capturedAt))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-surface-page px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div
        className={`text-lg font-semibold ${accent ? "text-brand" : ""} ${warn ? "text-amber-700" : "text-ink"}`}
      >
        {value}
      </div>
    </div>
  );
}
