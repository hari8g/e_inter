/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#136a62",
          dark: "#0f534d",
          muted: "#e8f4f2",
          border: "#b8dcd6",
        },
        surface: {
          DEFAULT: "#ffffff",
          page: "#f9fafb",
        },
        ink: {
          DEFAULT: "#111827",
          muted: "#6b7280",
          faint: "#9ca3af",
        },
        line: "#e5e7eb",
        live: "#16a34a",
        charge: "#7c3aed",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};
