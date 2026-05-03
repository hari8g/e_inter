import { randomUUID } from "node:crypto";
import type {
  FleetPolicy,
  GpsDevice,
  MaintenanceItem,
  Vehicle,
} from "../types/domain.js";
import {
  buildBatteryHealth,
  buildLifecycle,
  initialDevices,
  initialDriverSeeds,
  initialMaintenance,
  initialPolicy,
  initialVehicles,
} from "../seed/bengaluruFleet.js";
import { enrichBatteryHealth, enrichDrivers, enrichLifecycle } from "../services/prognosis.js";
import type { DriverClassification } from "../types/domain.js";

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

class FleetStore {
  policy: FleetPolicy = clone(initialPolicy);
  vehicles: Vehicle[] = clone(initialVehicles);
  devices: GpsDevice[] = clone(initialDevices);
  maintenance: MaintenanceItem[] = clone(initialMaintenance);

  reset() {
    this.policy = clone(initialPolicy);
    this.vehicles = clone(initialVehicles);
    this.devices = clone(initialDevices);
    this.maintenance = clone(initialMaintenance);
  }

  getVehicle(id: string) {
    return this.vehicles.find((v) => v.id === id) ?? null;
  }

  addVehicle(input: Omit<Vehicle, "id" | "position" | "status" | "deviceId"> & { seedLat: number; seedLng: number }) {
    const id = `v${randomUUID().slice(0, 8)}`;
    const vehicle: Vehicle = {
      id,
      registration: input.registration,
      displayName: input.displayName,
      model: input.model,
      telemetryMode: input.telemetryMode,
      allowImmobilise: input.allowImmobilise,
      kwhPack: input.kwhPack,
      odometerKm: input.odometerKm,
      socPercent: input.socPercent,
      status: "active",
      locationLabel: input.locationLabel,
      deviceId: null,
      position: {
        lat: input.seedLat,
        lng: input.seedLng,
        lastFixAt: new Date().toISOString(),
      },
      can:
        input.telemetryMode === "can_gps"
          ? {
              motorTempC: 35,
              packVoltageV: 50 + input.kwhPack,
              minCellV: 3.55,
              maxCellV: 3.62,
              bmsHealthScore: 90,
              capturedAt: new Date().toISOString(),
            }
          : undefined,
    };
    this.vehicles.push(vehicle);
    return vehicle;
  }

  registerDevice(serial?: string) {
    const id = `d${randomUUID().slice(0, 8)}`;
    const sn = serial?.trim() || `ELITE-GPS-${10000 + Math.floor(Math.random() * 80000)}`;
    const device: GpsDevice = {
      id,
      serial: sn,
      firmware: "2.4.1",
      type: "GPS",
      lastSeenAt: new Date().toISOString(),
      pairedVehicleId: null,
    };
    this.devices.unshift(device);
    return device;
  }

  unpairDevice(deviceId: string) {
    const d = this.devices.find((x) => x.id === deviceId);
    if (!d) return null;
    if (d.pairedVehicleId) {
      const v = this.vehicles.find((x) => x.id === d.pairedVehicleId);
      if (v && v.deviceId === deviceId) v.deviceId = null;
    }
    d.pairedVehicleId = null;
    return d;
  }

  addMaintenance(item: Omit<MaintenanceItem, "id" | "createdAt" | "status">) {
    const row: MaintenanceItem = {
      ...item,
      id: `m${randomUUID().slice(0, 8)}`,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    this.maintenance.unshift(row);
    return row;
  }

  updateMaintenanceStatus(id: string, status: MaintenanceItem["status"]) {
    const row = this.maintenance.find((m) => m.id === id);
    if (!row) return null;
    row.status = status;
    return row;
  }

  commandCenterSummary() {
    const reporting = this.vehicles.filter((v) => v.deviceId).length;
    const noLink = this.vehicles.length - reporting;
    const avgSoc =
      this.vehicles.reduce((s, v) => s + v.socPercent, 0) / Math.max(1, this.vehicles.length);
    const estRangeKm = Math.round(
      this.vehicles.reduce((s, v) => s + (v.socPercent / 100) * v.kwhPack * 42, 0),
    );
    const distanceTodayKm = 840;
    const energyKwh = -34.1;
    return {
      fleetTotal: this.vehicles.length,
      reporting,
      noLink,
      distanceTodayKm,
      avgSocPercent: Math.round(avgSoc),
      estRangePoolKm: estRangeKm,
      energyLedgerKwh: energyKwh,
      policy: this.policy,
      vehicles: this.vehicles,
    };
  }

  batteryHealth() {
    return enrichBatteryHealth(this.vehicles, buildBatteryHealth(this.vehicles));
  }

  lifecycle() {
    return enrichLifecycle(this.vehicles, buildLifecycle(this.vehicles));
  }

  drivers(): DriverClassification[] {
    return enrichDrivers(initialDriverSeeds);
  }

  tickCanNoise() {
    const t = new Date().toISOString();
    for (const v of this.vehicles) {
      if (v.telemetryMode !== "can_gps" || !v.can) continue;
      v.can.motorTempC = Math.max(28, Math.min(52, v.can.motorTempC + (Math.random() * 2 - 1)));
      v.can.packVoltageV = Math.max(45, Math.min(56, v.can.packVoltageV + (Math.random() * 0.2 - 0.1)));
      v.can.minCellV = Math.max(3.35, Math.min(3.7, v.can.minCellV + (Math.random() * 0.02 - 0.01)));
      v.can.maxCellV = Math.max(v.can.minCellV + 0.01, Math.min(3.75, v.can.maxCellV + (Math.random() * 0.02 - 0.01)));
      v.can.bmsHealthScore = Math.max(72, Math.min(99, Math.round(v.can.bmsHealthScore + (Math.random() * 2 - 1))));
      v.can.capturedAt = t;
    }
  }
}

export const fleetStore = new FleetStore();

/** Demo CAN jitter: long-lived hosts only (Render sets RENDER; local dev uses LISTEN). */
if (String(process.env.RENDER).toLowerCase() === "true" || process.env.LISTEN === "1") {
  setInterval(() => fleetStore.tickCanNoise(), 8000);
}
