import { Activity, BarChart3, BatteryCharging, Route, Shield } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "@/api/client";
import { chart, tooltipProps } from "@/lib/chartTheme";
import { PageHeader } from "@/layout/AppShell";
import { Card } from "@/ui/Card";

type Summary = { can: number; degrading: number; bandC: number };

function Spark({ data, color }: { data: { v: number }[]; color: string }) {
  const gid = useId().replace(/:/g, "");
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip {...tooltipProps} formatter={(v: number) => [`${v}`, ""]} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            fill={`url(#${gid})`}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Analytics() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [fleetSohSpark, setFleetSohSpark] = useState<{ v: number }[]>([]);
  const [wearSpark, setWearSpark] = useState<{ v: number }[]>([]);
  const [driverSpark, setDriverSpark] = useState<{ v: number }[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([api.canSnapshot(), api.batteryHealth(), api.drivers(), api.assetLifecycle()])
      .then(([can, bat, drv, life]) => {
        if (!alive) return;
        setSummary({
          can: can.items.length,
          degrading: bat.items.filter((b) => b.trend === "degrading").length,
          bandC: drv.items.filter((d) => d.band === "C").length,
        });
        const hist = bat.items[0]?.sohHistory ?? [];
        setFleetSohSpark(hist.slice(-8).map((h) => ({ v: h.soh })));
        const wear = life.items[0]?.wearSeries ?? [];
        setWearSpark(wear.map((w) => ({ v: w.wearIndex })));
        const sc = drv.items[0]?.safetyHistory ?? [];
        setDriverSpark(sc.map((s) => ({ v: s.score })));
      })
      .catch(() => alive && setSummary({ can: 0, degrading: 0, bandC: 0 }));
    return () => {
      alive = false;
    };
  }, []);

  const sparkSafe = useMemo(() => (fleetSohSpark.length ? fleetSohSpark : [{ v: 88 }]), [fleetSohSpark]);

  const tiles = [
    {
      to: "/battery-health",
      title: "Battery health",
      desc: "SOH trajectories, 12m projection, and pack imbalance risk bands.",
      icon: BatteryCharging,
      stat: summary ? `${summary.degrading} degrading packs` : "—",
      spark: sparkSafe,
      sparkColor: chart.brand,
    },
    {
      to: "/asset-lifecycle",
      title: "Asset lifecycle",
      desc: "Wear curves, major-service windows, and RUL envelopes.",
      icon: Route,
      stat: "Scatter + wear index",
      spark: wearSpark.length ? wearSpark : [{ v: 42 }],
      sparkColor: chart.warn,
    },
    {
      to: "/drivers",
      title: "Driver classification",
      desc: "Radar fingerprints and safety momentum for coaching.",
      icon: Shield,
      stat: summary ? `${summary.bandC} in band C` : "—",
      spark: driverSpark.length ? driverSpark : [{ v: 75 }],
      sparkColor: chart.accent,
    },
    {
      to: "/can-bus",
      title: "CAN telemetry",
      desc: "Live BMS / inverter aggregates powering the models above.",
      icon: Activity,
      stat: summary ? `${summary.can} CAN assets` : "—",
      spark: [
        { v: 3 },
        { v: 5 },
        { v: 4 },
        { v: 7 },
        { v: 6 },
        { v: 8 },
        { v: 7 },
        { v: 9 },
      ],
      sparkColor: chart.brand,
    },
  ];

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        title="Analytics suite"
        description="Each module ships prognosis-aware charts — sparklines here are quick pulse checks before you dive into the full workspaces."
        actions={
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink shadow-sm hover:bg-surface-page"
          >
            <BarChart3 className="h-4 w-4 text-brand" />
            Back to ops
          </Link>
        }
      />
      <div className="grid gap-5 md:grid-cols-2">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="group block">
            <Card className="h-full overflow-hidden transition group-hover:border-brand-border group-hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand">Module</div>
                  <h2 className="mt-1 text-lg font-semibold text-ink group-hover:text-brand">{t.title}</h2>
                </div>
                <t.icon className="h-5 w-5 text-ink-faint group-hover:text-brand" />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t.desc}</p>
              <div className="mt-4 rounded-lg border border-line bg-surface-page/80 px-2 py-2">
                <Spark data={t.spark} color={t.sparkColor} />
              </div>
              <div className="mt-3 text-xs font-semibold text-ink">{t.stat}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
