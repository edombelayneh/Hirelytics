// tailwind.config.ts
import type { Config } from "tailwindcss"

export default {
  content: ["./app/**/*.{ts,tsx,js,jsx}", "./components/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
} satisfies Config

