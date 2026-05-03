import { Router } from "express";
import { z } from "zod";
import { fleetStore } from "../store/fleetStore.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, product: "e-inter", layer: "api" });
});

apiRouter.get("/command-center", (_req, res) => {
  res.json(fleetStore.commandCenterSummary());
});

apiRouter.get("/policy", (_req, res) => {
  res.json(fleetStore.policy);
});

const policySchema = z.object({
  showMap: z.boolean().optional(),
  showSocStrip: z.boolean().optional(),
  showImmobilise: z.boolean().optional(),
  highlightLowSoc: z.boolean().optional(),
  showAssetStrip: z.boolean().optional(),
  showTripLedger: z.boolean().optional(),
  highlightStaleGps: z.boolean().optional(),
  gpsUplinkTargetSeconds: z.number().min(10).max(600).optional(),
  stalePositionMinutes: z.number().min(1).max(240).optional(),
  lowSocAlertPercent: z.number().min(5).max(80).optional(),
  geofenceBreachAlerts: z.boolean().optional(),
});

apiRouter.put("/policy", (req, res) => {
  const parsed = policySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  fleetStore.policy = { ...fleetStore.policy, ...parsed.data };
  res.json(fleetStore.policy);
});

apiRouter.get("/vehicles", (_req, res) => {
  res.json(fleetStore.vehicles);
});

const registerVehicleSchema = z.object({
  registration: z.string().min(3),
  displayName: z.string().min(1),
  model: z.string().min(1),
  telemetryMode: z.enum(["gps_only", "can_gps"]),
  allowImmobilise: z.boolean(),
  seedLat: z.number(),
  seedLng: z.number(),
  kwhPack: z.number().positive(),
  odometerKm: z.number().nonnegative(),
  socPercent: z.number().min(0).max(100),
  locationLabel: z.string().min(1),
});

apiRouter.post("/vehicles", (req, res) => {
  const parsed = registerVehicleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const v = fleetStore.addVehicle(parsed.data);
  res.status(201).json(v);
});

apiRouter.get("/devices", (_req, res) => {
  res.json(fleetStore.devices);
});

apiRouter.post("/devices", (req, res) => {
  const serial = typeof req.body?.serial === "string" ? req.body.serial : undefined;
  const d = fleetStore.registerDevice(serial);
  res.status(201).json(d);
});

apiRouter.post("/devices/:id/unpair", (req, res) => {
  const d = fleetStore.unpairDevice(req.params.id);
  if (!d) return res.status(404).json({ error: "not_found" });
  res.json(d);
});

apiRouter.get("/maintenance", (_req, res) => {
  res.json(fleetStore.maintenance);
});

const maintSchema = z.object({
  vehicleId: z.string(),
  workType: z.string(),
  title: z.string(),
  dueDate: z.string(),
  odometerAtDueKm: z.number().nullable().optional(),
  vendor: z.string().nullable().optional(),
  notes: z.string(),
});

apiRouter.post("/maintenance", (req, res) => {
  const parsed = maintSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const row = fleetStore.addMaintenance({
    ...parsed.data,
    odometerAtDueKm: parsed.data.odometerAtDueKm ?? null,
    vendor: parsed.data.vendor ?? null,
  });
  res.status(201).json(row);
});

apiRouter.patch("/maintenance/:id", (req, res) => {
  const status = z.enum(["open", "in_progress", "done"]).safeParse(req.body?.status);
  if (!status.success) return res.status(400).json({ error: "invalid_status" });
  const row = fleetStore.updateMaintenanceStatus(req.params.id, status.data);
  if (!row) return res.status(404).json({ error: "not_found" });
  res.json(row);
});

apiRouter.get("/analytics/battery-health", (_req, res) => {
  res.json({ updatedAt: new Date().toISOString(), items: fleetStore.batteryHealth() });
});

apiRouter.get("/analytics/asset-lifecycle", (_req, res) => {
  res.json({ updatedAt: new Date().toISOString(), items: fleetStore.lifecycle() });
});

apiRouter.get("/analytics/driver-classification", (_req, res) => {
  res.json({ updatedAt: new Date().toISOString(), items: fleetStore.drivers() });
});

apiRouter.get("/can/snapshot", (_req, res) => {
  const items = fleetStore.vehicles
    .filter((v) => v.telemetryMode === "can_gps" && v.can)
    .map((v) => ({
      vehicleId: v.id,
      registration: v.registration,
      snapshot: v.can!,
    }));
  res.json({ updatedAt: new Date().toISOString(), items });
});
