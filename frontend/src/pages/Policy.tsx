import { Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/api/client";
import { PageHeader } from "@/layout/AppShell";
import { Button } from "@/ui/Button";
import { Callout } from "@/ui/Callout";
import { Card } from "@/ui/Card";
import { Field } from "@/ui/Field";
import { Input } from "@/ui/Input";
import type { FleetPolicy } from "@/types/api";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-white px-3 py-2.5 hover:bg-surface-page">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-line text-brand focus:ring-brand"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-sm text-ink">{label}</span>
    </label>
  );
}

export default function Policy() {
  const [p, setP] = useState<FleetPolicy | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.policy().then(setP).catch(() => setP(null));
  }, []);

  async function persist(next: FleetPolicy) {
    setSaving(true);
    try {
      const saved = await api.updatePolicy(next);
      setP(saved);
    } finally {
      setSaving(false);
    }
  }

  if (!p) return <div className="text-sm text-ink-muted">Loading policy…</div>;

  return (
    <div className="pb-20 lg:pb-0">
      <PageHeader
        title="Fleet policy"
        description="Telemetry rules and command-centre visibility for mixed GPS / CAN electric 2W operations. Changes apply immediately to the command centre."
      />
      <Callout icon={Eye}>
        These controls turn panels on/off for operators and set alert highlights (low SOC, stale GPS, geofence readiness).
        CAN streams continue server-side even when a panel is hidden.
      </Callout>
      <Card className="mt-6 space-y-8">
        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <Eye className="h-4 w-4 text-brand" />
            Command centre visibility
          </div>
          <p className="mb-4 text-sm text-ink-muted">
            Controls what appears on the operations dashboard. Does not stop ingestion on devices.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <Toggle checked={p.showMap} onChange={(v) => void persist({ ...p, showMap: v })} label="Operational map (live positions)" />
            <Toggle checked={p.showAssetStrip} onChange={(v) => void persist({ ...p, showAssetStrip: v })} label="Live asset strip (side list)" />
            <Toggle checked={p.showSocStrip} onChange={(v) => void persist({ ...p, showSocStrip: v })} label="SOC & est. range in strip" />
            <Toggle checked={p.showTripLedger} onChange={(v) => void persist({ ...p, showTripLedger: v })} label="Trip & energy ledger table" />
            <Toggle checked={p.showImmobilise} onChange={(v) => void persist({ ...p, showImmobilise: v })} label="Immobilise / release buttons" />
            <Toggle checked={p.highlightLowSoc} onChange={(v) => void persist({ ...p, highlightLowSoc: v })} label="Highlight low-SOC against policy threshold" />
            <Toggle checked={p.highlightStaleGps} onChange={(v) => void persist({ ...p, highlightStaleGps: v })} label="Highlight assets past GPS freshness SLA" />
          </div>
        </section>
        <section className="rounded-xl border border-line bg-surface-page p-5">
          <div className="mb-4 text-sm font-semibold text-ink">Telemetry & alert thresholds</div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="GPS uplink target interval">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={p.gpsUplinkTargetSeconds}
                  onChange={(e) => setP({ ...p, gpsUplinkTargetSeconds: Number(e.target.value) })}
                  min={10}
                  max={600}
                />
                <span className="text-xs text-ink-muted">seconds</span>
              </div>
            </Field>
            <Field label="Stale position threshold">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={p.stalePositionMinutes}
                  onChange={(e) => setP({ ...p, stalePositionMinutes: Number(e.target.value) })}
                  min={1}
                  max={240}
                />
                <span className="text-xs text-ink-muted">minutes</span>
              </div>
            </Field>
            <Field label="Low SOC alert threshold">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={p.lowSocAlertPercent}
                  onChange={(e) => setP({ ...p, lowSocAlertPercent: Number(e.target.value) })}
                  min={5}
                  max={80}
                />
                <span className="text-xs text-ink-muted">% pack</span>
              </div>
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
              checked={p.geofenceBreachAlerts}
              onChange={(e) => void persist({ ...p, geofenceBreachAlerts: e.target.checked })}
            />
            Geofence breach alerts <span className="text-ink-muted">(when zones are configured downstream)</span>
          </label>
          <div className="mt-4 flex justify-end">
            <Button disabled={saving} onClick={() => void persist(p)}>
              Save thresholds
            </Button>
          </div>
        </section>
      </Card>
    </div>
  );
}
