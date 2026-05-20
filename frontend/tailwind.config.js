/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: {
          bg: "var(--app-bg)",
          card: "var(--app-card)",
          muted: "var(--app-muted)",
          text: "var(--app-text)",
          "text-secondary": "var(--app-text-secondary)",
          "text-muted": "var(--app-text-muted)",
          border: "var(--app-border)",
          "border-strong": "var(--app-border-strong)",
          "brand-muted": "var(--app-brand-muted)",
          "accent-muted": "var(--app-accent-muted)",
          "danger-muted": "var(--app-danger-muted)",
          "warning-muted": "var(--app-warning-muted)",
          "success-muted": "var(--app-success-muted)",
          header: "var(--app-header)",
          "tab-bar": "var(--app-tab-bar)",
          "tab-border": "var(--app-tab-border)",
          "shell-backdrop": "var(--app-shell-backdrop)",
        },
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        accent: {
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
        },
      },
    },
  },
  plugins: [],
};
