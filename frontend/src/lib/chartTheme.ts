/** Shared Recharts styling aligned with e-inter / e-lite teal system */

export const chart = {
  brand: "#136a62",
  brandMuted: "#b8dcd6",
  forecast: "#94a3b8",
  accent: "#7c3aed",
  warn: "#d97706",
  danger: "#dc2626",
  grid: "#e5e7eb",
  label: "#6b7280",
  labelStrong: "#374151",
  surface: "#ffffff",
};

export const axisProps = {
  stroke: chart.label,
  tick: { fill: chart.label, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: chart.grid },
};

export const cartesianGrid = {
  strokeDasharray: "3 3" as const,
  stroke: chart.grid,
  vertical: false,
};

export const tooltipProps = {
  contentStyle: {
    borderRadius: 10,
    border: `1px solid ${chart.grid}`,
    fontSize: 12,
    boxShadow: "0 4px 20px rgba(15,23,42,0.08)",
  },
  labelStyle: { fontWeight: 600, color: chart.labelStrong },
};
