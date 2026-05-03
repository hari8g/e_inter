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

/**
 * Builds `/api/v1` against the current origin (Vite dev proxy), or an absolute
 * base when `VITE_API_ORIGIN` is set. Normalizes the env value so `fetch` never
 * receives a malformed URL (WebKit: "The string did not match the expected pattern").
 */
function resolveApiBase(): string {
  const raw = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim() ?? "";
  if (!raw) return "/api/v1";

  let toParse = raw.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(toParse)) {
    if (/^(\[::1\]|localhost|127\.0\.0\.1)/i.test(toParse)) {
      toParse = `http://${toParse}`;
    } else {
      toParse = `https://${toParse}`;
    }
  }

  let u: URL;
  try {
    u = new URL(toParse);
  } catch {
    console.warn("[e-inter] Invalid VITE_API_ORIGIN; using same-origin /api/v1", raw);
    return "/api/v1";
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    console.warn("[e-inter] VITE_API_ORIGIN must be http(s); using /api/v1");
    return "/api/v1";
  }
  if (!u.hostname) {
    return "/api/v1";
  }
  return `${u.origin}/api/v1`;
}

const base = resolveApiBase();

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
