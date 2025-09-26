import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        glass: {
          background: "hsl(var(--glass-background))",
          border: "hsl(var(--glass-border))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        glass: "16px", /* Custom radius for glassmorphism card */
      },
      backdropBlur: {
        glass: "var(--glass-backdrop-blur)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "drift-left": {
          "0%": { transform: "translateY(0px) scale(1)" },
          "25%": { transform: "translateY(-20px) scale(1.05)" },
          "50%": { transform: "translateY(10px) scale(0.95)" },
          "75%": { transform: "translateY(-15px) scale(1.02)" },
          "100%": { transform: "translateY(0px) scale(1)" }
        },
        "drift-right": {
          "0%": { transform: "translateY(0px) scale(1)" },
          "25%": { transform: "translateY(15px) scale(0.98)" },
          "50%": { transform: "translateY(-25px) scale(1.03)" },
          "75%": { transform: "translateY(8px) scale(0.97)" },
          "100%": { transform: "translateY(0px) scale(1)" }
        },
        "color-spread-red": {
          "0%": { transform: "scale(1) rotate(0deg)", opacity: "0.2" },
          "25%": { transform: "scale(1.2) rotate(90deg)", opacity: "0.3" },
          "50%": { transform: "scale(0.8) rotate(180deg)", opacity: "0.2" },
          "75%": { transform: "scale(1.1) rotate(270deg)", opacity: "0.4" },
          "100%": { transform: "scale(1) rotate(360deg)", opacity: "0.2" }
        },
        "color-spread-blue": {
          "0%": { transform: "scale(1) rotate(0deg)", opacity: "0.3" },
          "25%": { transform: "scale(0.9) rotate(-90deg)", opacity: "0.2" },
          "50%": { transform: "scale(1.3) rotate(-180deg)", opacity: "0.4" },
          "75%": { transform: "scale(0.7) rotate(-270deg)", opacity: "0.3" },
          "100%": { transform: "scale(1) rotate(-360deg)", opacity: "0.3" }
        },
        "gradient-flow": {
          "0%": { transform: "translateX(-100%) rotate(0deg)" },
          "50%": { transform: "translateX(0%) rotate(180deg)" },
          "100%": { transform: "translateX(100%) rotate(360deg)" }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "drift-left": "drift-left 20s ease-in-out infinite",
        "drift-right": "drift-right 20s ease-in-out infinite 10s",
        "color-spread-red": "color-spread-red 15s ease-in-out infinite",
        "color-spread-blue": "color-spread-blue 18s ease-in-out infinite",
        "gradient-flow": "gradient-flow 25s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
