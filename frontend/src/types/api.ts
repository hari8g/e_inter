export type TelemetryMode = "gps_only" | "can_gps";
export type VehicleStatus = "active" | "charging" | "idle" | "offline";

export interface Position {
  lat: number;
  lng: number;
  lastFixAt: string;
}

export interface CanSnapshot {
  motorTempC: number;
  packVoltageV: number;
  minCellV: number;
  maxCellV: number;
  bmsHealthScore: number;
  capturedAt: string;
}

export interface Vehicle {
  id: string;
  registration: string;
  displayName: string;
  model: string;
  telemetryMode: TelemetryMode;
  allowImmobilise: boolean;
  kwhPack: number;
  odometerKm: number;
  socPercent: number;
  status: VehicleStatus;
  locationLabel: string;
  position: Position;
  deviceId: string | null;
  can?: CanSnapshot;
}

export interface GpsDevice {
  id: string;
  serial: string;
  firmware: string;
  type: "GPS" | "CAN_GATEWAY";
  lastSeenAt: string;
  pairedVehicleId: string | null;
}

export type MaintenanceStatus = "open" | "in_progress" | "done";

export interface MaintenanceItem {
  id: string;
  vehicleId: string;
  workType: string;
  title: string;
  dueDate: string;
  odometerAtDueKm: number | null;
  vendor: string | null;
  notes: string;
  status: MaintenanceStatus;
  createdAt: string;
}

export interface FleetPolicy {
  showMap: boolean;
  showSocStrip: boolean;
  showImmobilise: boolean;
  highlightLowSoc: boolean;
  showAssetStrip: boolean;
  showTripLedger: boolean;
  highlightStaleGps: boolean;
  gpsUplinkTargetSeconds: number;
  stalePositionMinutes: number;
  lowSocAlertPercent: number;
  geofenceBreachAlerts: boolean;
}

export interface CommandCenterPayload {
  fleetTotal: number;
  reporting: number;
  noLink: number;
  distanceTodayKm: number;
  avgSocPercent: number;
  estRangePoolKm: number;
  energyLedgerKwh: number;
  policy: FleetPolicy;
  vehicles: Vehicle[];
}

export interface BatteryHeuristics {
  cellImbalanceSeverity0to100: number;
  cycleLoadIndex0to100: number;
  packCalendarAgeIndex0to100: number;
  thermalStress0to100: number | null;
  bmsObservationQuality0to100: number | null;
  depthOfDischargeStress0to100: number;
  modelHealthScore0to100: number;
  rationale: string[];
}

export interface BatteryDeteriorationBreakdownPct {
  calendarAgeing: number;
  cyclicElectrical: number;
  cellImbalance: number;
  thermalElectrical: number;
}

export interface BatteryDeterioration {
  past12mSohLossPct: number;
  projectedNext12mLossPct: number;
  impliedHistoricalFadePctPerMonth: number;
  impliedForecastFadePctPerMonth: number;
  breakdownPastFade: BatteryDeteriorationBreakdownPct;
}

export interface BatteryHealthPoint {
  vehicleId: string;
  registration: string;
  sohPercent: number;
  cycleEstimate: number;
  imbalanceMv: number;
  trend: "improving" | "stable" | "degrading";
  sohHistory: { period: string; soh: number }[];
  sohForecast: { period: string; soh: number }[];
  heuristics: BatteryHeuristics;
  deterioration: BatteryDeterioration;
  prognosis: {
    thresholdSoh: number;
    monthsToThreshold: number | null;
    sohProjected12m: number;
    confidence: "high" | "medium" | "low";
    summary: string;
    imbalanceRisk: "normal" | "watch" | "elevated";
  };
}

export interface AssetLifecycleHeuristics {
  telemetryMode: TelemetryMode;
  canObservability: "full" | "gps_only";
  kmToNextMajorService: number;
  dutyCycleIndex: number;
  thermalStressIndex: number;
  depthOfDischargeScore: number;
  calendarAgeMonths: number;
  reliabilityIndex: number;
  warrantyClockMonthsRemaining: number | null;
  dataConfidence: "high" | "medium" | "low";
  flags: string[];
}

export interface AssetLifecycleStage {
  vehicleId: string;
  registration: string;
  stage: "ramp" | "steady" | "watch" | "retire_candidate";
  utilizationScore: number;
  projectedMajorServiceKm: number;
  odometerKm: number;
  notes: string;
  wearSeries: { km: number; wearIndex: number }[];
  heuristics: AssetLifecycleHeuristics;
  /** Plain-language readout for operators (from API). */
  operatorSummary: string;
  operatorFindings: string[];
  operatorActions: string[];
  prognosis: {
    remainingUsefulLifeKm: number;
    majorServiceWindowKm: [number, number];
    summary: string;
    nextDecisionGate: string;
    nextMajorServiceDueIso: string;
    nextMajorServiceDueLabel: string;
    estimatedMonthsToMajorService: number;
  };
}

export interface DriverClassification {
  driverId: string;
  label: string;
  safetyScore: number;
  energyEfficiencyPercentile: number;
  harshEvents7d: number;
  band: "A" | "B" | "C";
  profile: {
    smoothness: number;
    ecoDrive: number;
    compliance: number;
    fatigueRisk: number;
  };
  safetyHistory: { week: string; score: number }[];
  prognosis: {
    summary: string;
    projectedBand90d: "A" | "B" | "C";
    priority: "maintain" | "coach" | "intervene";
    reviewBy: string;
  };
}
