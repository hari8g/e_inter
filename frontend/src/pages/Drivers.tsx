import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/api/client";
import { chart, cartesianGrid, axisProps, tooltipProps } from "@/lib/chartTheme";
import { PageHeader } from "@/layout/AppShell";
import { Card } from "@/ui/Card";
import type { DriverClassification } from "@/types/api";

const bandColor: Record<DriverClassification["band"], string> = {
  A: "#136a62",
  B: "#2563eb",
  C: "#dc2626",
};

function radarRows(d: DriverClassification) {
  return [
    { subject: "Safety", score: d.safetyScore },
    { subject: "Smoothness", score: d.profile.smoothness },
    { subject: "Eco drive", score: d.profile.ecoDrive },
    { subject: "Compliance", score: d.profile.compliance },
    { subject: "Fatigue risk", score: 100 - d.profile.fatigueRisk },
  ];
}

function priorityStyles(p: DriverClassification["prognosis"]["priority"]) {
  if (p === "intervene") return "bg-rose-50 text-rose-900 ring-rose-100";
  if (p === "coach") return "bg-amber-50 text-amber-900 ring-amber-100";
  return "bg-emerald-50 text-emerald-900 ring-emerald-100";
}

export default function Drivers() {
  const [items, setItems] = useState<DriverClassification[]>([]);

  useEffect(() => {
    api.drivers().then((r) => setItems(r.items));
  }, []);

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        title="Driver classification"
        description="Radar view compresses multi-axis behaviour; the trailing safety curve shows momentum into the 90-day band projection. Use both panels when designing coaching cadence."
      />
      <div className="grid gap-6">
        {items.map((d) => {
          const stroke = bandColor[d.band];
          return (
            <Card key={d.driverId} className="overflow-hidden p-0">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Driver</div>
                  <div className="text-lg font-semibold text-ink">{d.label}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow"
                    style={{ background: stroke }}
                  >
                    {d.band}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ring-1 ${priorityStyles(d.prognosis.priority)}`}>
                    {d.prognosis.priority}
                  </span>
                  <span className="text-xs text-ink-muted">
                    90d → band <span className="font-semibold text-ink">{d.prognosis.projectedBand90d}</span>
                  </span>
                </div>
              </div>
              <div className="grid gap-4 p-4 lg:grid-cols-12">
                <div className="lg:col-span-4">
                  <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Behaviour fingerprint
                  </div>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius={100} data={radarRows(d)}>
                        <PolarGrid stroke={chart.grid} />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: chart.label }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: chart.label }} />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke={stroke}
                          fill={stroke}
                          fillOpacity={0.28}
                          strokeWidth={2}
                        />
                        <Tooltip {...tooltipProps} formatter={(v: number) => [v, "Score"]} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-8">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Safety score trajectory (rolling weeks)
                  </div>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={d.safetyHistory} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`safe-${d.driverId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={stroke} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid {...cartesianGrid} />
                        <XAxis dataKey="week" {...axisProps} />
                        <YAxis domain={[40, 100]} {...axisProps} width={32} />
                        <Tooltip {...tooltipProps} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line
                          type="monotone"
                          dataKey="score"
                          name="Safety"
                          stroke={stroke}
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: stroke }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              <div className="border-t border-line bg-brand-muted/15 px-5 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-brand">Prognosis</div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{d.prognosis.summary}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-muted">
                  <span>
                    Harsh events (7d) <span className="font-semibold text-ink">{d.harshEvents7d}</span>
                  </span>
                  <span>
                    Energy %tile <span className="font-semibold text-ink">{d.energyEfficiencyPercentile}</span>
                  </span>
                  <span>
                    Review by <span className="font-semibold text-ink">{d.prognosis.reviewBy}</span>
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
                  <Shield className="h-4 w-4 shrink-0 text-brand" />
                  Banding uses fleet-relative thresholds; connect HRIS for named roster rollouts.
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
