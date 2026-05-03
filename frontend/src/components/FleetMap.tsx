import { useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet";
import type { FleetPolicy, Vehicle } from "@/types/api";
import "leaflet/dist/leaflet.css";

const center: [number, number] = [12.95, 77.62];

function staleMinutes(lastFixAt: string, thresholdMin: number) {
  const diff = Date.now() - new Date(lastFixAt).getTime();
  return diff > thresholdMin * 60 * 1000;
}

export function FleetMap({
  vehicles,
  policy,
}: {
  vehicles: Vehicle[];
  policy: FleetPolicy;
}) {
  const markers = useMemo(() => vehicles, [vehicles]);
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-line shadow-card sm:h-[520px]">
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((v) => {
          const isCharging = v.status === "charging";
          const isStale = policy.highlightStaleGps && staleMinutes(v.position.lastFixAt, policy.stalePositionMinutes);
          const color = isCharging ? "#7c3aed" : isStale ? "#f59e0b" : "#136a62";
          return (
            <CircleMarker
              key={v.id}
              center={[v.position.lat, v.position.lng]}
              radius={11}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: color,
                fillOpacity: 0.95,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent={false}>
                <div className="text-xs font-semibold">{v.registration}</div>
                <div className="text-[11px] text-gray-600">{v.locationLabel}</div>
              </Tooltip>
              <Popup>
                <div className="space-y-1 text-sm">
                  <div className="font-semibold">{v.registration}</div>
                  <div className="text-gray-600">{v.displayName}</div>
                  <div>
                    SOC <span className="font-semibold">{v.socPercent}%</span> ·{" "}
                    {v.telemetryMode === "can_gps" ? "CAN+GPS" : "GPS"}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
