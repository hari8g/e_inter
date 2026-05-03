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
      operatorLine: "Which packs are losing SOH fastest, and why?",
      desc: "Fleet SOH ranking, 12-month history blend, fade attribution (calendar / cycles / imbalance / thermal), and pack stress meters. Use before scheduling swaps or deep diagnostics.",
      icon: BatteryCharging,
      stat: summary ? `${summary.degrading} vehicle(s) on a degrading SOH trend` : "—",
      spark: sparkSafe,
      sparkColor: chart.brand,
    },
    {
      to: "/asset-lifecycle",
      title: "Asset lifecycle",
      operatorLine: "When is the next major service, and how hard is the asset being used?",
      desc: "Odometer-forward view: wear index, projected major-service window, duty and thermal hints. Good for workshop planning and retire/watch decisions.",
      icon: Route,
      stat: "Open for wear curve and service horizon",
      spark: wearSpark.length ? wearSpark : [{ v: 42 }],
      sparkColor: chart.warn,
    },
    {
      to: "/drivers",
      title: "Driver classification",
      operatorLine: "Who needs coaching on safety and efficiency?",
      desc: "Demo driver cohort with band (A–C), radar scores, and safety trajectory. Pair with incidents or complaints to prioritise training.",
      icon: Shield,
      stat: summary ? `${summary.bandC} driver(s) currently in band C (highest watch)` : "—",
      spark: driverSpark.length ? driverSpark : [{ v: 75 }],
      sparkColor: chart.accent,
    },
    {
      to: "/can-bus",
      title: "CAN telemetry",
      operatorLine: "What live BMS / inverter signals are feeding the models?",
      desc: "Snapshot of motor temp, pack voltage, cell spread, and BMS quality for CAN-equipped vehicles. Confirms whether data quality supports the battery views.",
      icon: Activity,
      stat: summary ? `${summary.can} asset(s) with CAN + GPS stream` : "—",
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
        title="Analytics hub"
        description="One place for fleet analysts and control-room operators: pick a workspace below. Each card opens the full module; sparklines are a quick pulse only."
        actions={
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink shadow-sm hover:bg-surface-page"
          >
            <BarChart3 className="h-4 w-4 text-brand" />
            Back to command centre
          </Link>
        }
      />

      <Card className="mb-6 border-brand-border/60 bg-brand-muted/25 p-4 text-sm leading-relaxed text-ink">
        <div className="text-xs font-bold uppercase tracking-wide text-brand">How to use this page</div>
        <ul className="mt-2 list-inside list-disc space-y-1 text-ink-muted marker:text-brand">
          <li>Start with <strong className="text-ink">Battery health</strong> if you are triaging pack risk or SOH complaints.</li>
          <li>Use <strong className="text-ink">Asset lifecycle</strong> for odometer-based service planning and end-of-life watch.</li>
          <li>Open <strong className="text-ink">Driver classification</strong> for coaching queues (bands and safety trend).</li>
          <li>Check <strong className="text-ink">CAN telemetry</strong> when you need to confirm live BMS feeds for CAN assets.</li>
        </ul>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="group block">
            <Card className="h-full overflow-hidden transition group-hover:border-brand-border group-hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand">Workspace</div>
                  <h2 className="mt-1 text-lg font-semibold text-ink group-hover:text-brand">{t.title}</h2>
                </div>
                <t.icon className="h-5 w-5 text-ink-faint group-hover:text-brand" />
              </div>
              <p className="mt-1 text-xs font-medium text-ink">{t.operatorLine}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t.desc}</p>
              <div className="mt-4 rounded-lg border border-line bg-surface-page/80 px-2 py-2">
                <Spark data={t.spark} color={t.sparkColor} />
              </div>
              <div className="mt-3 text-xs font-semibold text-ink">{t.stat}</div>
              <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-brand opacity-0 transition group-hover:opacity-100">
                Open module →
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
