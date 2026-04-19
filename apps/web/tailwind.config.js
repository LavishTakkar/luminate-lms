/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        glass: "hsl(var(--glass))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "'Outfit'", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "mesh-lavender":
          "radial-gradient(at 18% 18%, hsl(270 85% 72% / 0.55) 0px, transparent 55%), radial-gradient(at 82% 12%, hsl(320 80% 72% / 0.45) 0px, transparent 55%), radial-gradient(at 50% 90%, hsl(28 90% 68% / 0.4) 0px, transparent 55%), radial-gradient(at 92% 82%, hsl(250 80% 70% / 0.5) 0px, transparent 55%)",
        "mesh-midnight":
          "radial-gradient(at 20% 20%, hsl(260 60% 32% / 0.9) 0px, transparent 55%), radial-gradient(at 80% 15%, hsl(295 55% 28% / 0.85) 0px, transparent 55%), radial-gradient(at 50% 90%, hsl(220 70% 20% / 0.85) 0px, transparent 55%), radial-gradient(at 90% 80%, hsl(270 70% 35% / 0.75) 0px, transparent 55%)",
      },
      keyframes: {
        "mesh-drift": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(-2%, -1%, 0) scale(1.04)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "mesh-drift": "mesh-drift 18s ease-in-out infinite",
        "fade-up": "fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      boxShadow: {
        glass:
          "0 1px 0 0 hsl(0 0% 100% / 0.2) inset, 0 18px 50px -20px hsl(260 50% 10% / 0.35)",
        "glass-sm":
          "0 1px 0 0 hsl(0 0% 100% / 0.15) inset, 0 8px 24px -12px hsl(260 50% 10% / 0.3)",
      },
    },
  },
  plugins: [],
};
