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
 * Reads `VITE_API_ORIGIN` with common dashboard / .env mistakes removed (quotes,
 * CR/LF). Vite only exposes `VITE_*` to the client as strings.
 */
function readApiOriginEnv(): string {
  let raw = String(import.meta.env.VITE_API_ORIGIN ?? "").trim();
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim();
  }
  raw = raw.replace(/[\r\n\t]+/g, "");
  return raw;
}

/**
 * Builds `/api/v1` for Vite dev proxy, or `https?://…/api/v1` when `VITE_API_ORIGIN`
 * is set. Invalid values fall back to `/api/v1`.
 */
function resolveApiBase(): string {
  const raw = readApiOriginEnv();
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

/**
 * Relative `/api/v1/…` cannot be resolved by `fetch` on `file:` pages or opaque
 * origins (`location.origin === "null"`), which surfaces as WebKit’s
 * "The string did not match the expected pattern."
 */
function buildFetchUrl(path: string): string {
  const joined = `${base}${path}`;
  if (joined.startsWith("http://") || joined.startsWith("https://")) {
    try {
      return new URL(joined).href;
    } catch {
      console.warn("[e-inter] Invalid resolved API URL", joined);
      return `http://127.0.0.1:8787/api/v1${path}`;
    }
  }
  if (typeof window !== "undefined") {
    const { protocol, origin } = window.location;
    if (protocol === "file:" || origin === "null" || origin === "") {
      return `http://127.0.0.1:8787/api/v1${path}`;
    }
  }
  return joined;
}

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildFetchUrl(path);
  const headers = init?.headers ? new Headers(init.headers as HeadersInit) : new Headers();
  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, {
    ...init,
    headers,
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
