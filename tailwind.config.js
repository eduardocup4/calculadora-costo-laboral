/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // SAFELIST: Vital para que funcionen las clases dinámicas como `bg-${color}-50`
  safelist: [
    {
      pattern: /bg-(blue|emerald|purple|amber|red|indigo|slate)-(50|100|500|600|700)/,
      variants: ['hover', 'group-hover'],
    },
    {
      pattern: /text-(blue|emerald|purple|amber|red|indigo|slate)-(400|500|600|700|800)/,
    },
    {
      pattern: /border-(blue|emerald|purple|amber|red|indigo|slate)-(100|200|300|500)/,
    },
    {
      pattern: /from-(blue|emerald|purple|amber|red|indigo|slate)-(50|100|500|600|700)/,
    },
    {
      pattern: /to-(blue|emerald|purple|amber|red|indigo|slate)-(50|100|500|600|700)/,
    }
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}