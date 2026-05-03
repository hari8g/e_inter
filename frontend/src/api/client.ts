import type {
  AssetLifecycleStage,
  BatteryHealthPoint,
  CanSnapshot,
  CommandCenterPayload,
  DriverClassification,
  FleetPolicy,
  GpsDevice,
  MaintenanceItem,
  Vehicle,
} from "@/types/api";

/** Production: set VITE_API_ORIGIN to backend origin (no trailing slash), e.g. https://e-inter-api.vercel.app */
const origin = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.replace(/\/$/, "") ?? "";
const base = origin ? `${origin}/api/v1` : "/api/v1";

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  commandCenter: () => j<CommandCenterPayload>("/command-center"),
  policy: () => j<FleetPolicy>("/policy"),
  updatePolicy: (body: Partial<FleetPolicy>) =>
    j<FleetPolicy>("/policy", { method: "PUT", body: JSON.stringify(body) }),
  vehicles: () => j<Vehicle[]>("/vehicles"),
  registerVehicle: (body: Record<string, unknown>) =>
    j<Vehicle>("/vehicles", { method: "POST", body: JSON.stringify(body) }),
  devices: () => j<GpsDevice[]>("/devices"),
  registerDevice: (serial?: string) =>
    j<GpsDevice>("/devices", { method: "POST", body: JSON.stringify({ serial }) }),
  unpairDevice: (id: string) => j<GpsDevice>(`/devices/${id}/unpair`, { method: "POST" }),
  maintenance: () => j<MaintenanceItem[]>("/maintenance"),
  addMaintenance: (body: Record<string, unknown>) =>
    j<MaintenanceItem>("/maintenance", { method: "POST", body: JSON.stringify(body) }),
  updateMaintenanceStatus: (id: string, status: MaintenanceItem["status"]) =>
    j<MaintenanceItem>(`/maintenance/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  batteryHealth: () => j<{ updatedAt: string; items: BatteryHealthPoint[] }>("/analytics/battery-health"),
  assetLifecycle: () => j<{ updatedAt: string; items: AssetLifecycleStage[] }>("/analytics/asset-lifecycle"),
  drivers: () => j<{ updatedAt: string; items: DriverClassification[] }>("/analytics/driver-classification"),
  canSnapshot: () =>
    j<{ updatedAt: string; items: { vehicleId: string; registration: string; snapshot: CanSnapshot }[] }>(
      "/can/snapshot",
    ),
};
