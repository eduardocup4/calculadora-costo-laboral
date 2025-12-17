/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**", // <--- ESTA LÍNEA ES LA SOLUCIÓN (Ignora node_modules)
  ],
  safelist: [
    // Patrones para asegurar que los colores dinámicos de las tarjetas no sean purgados
    {
      pattern: /bg-(blue|emerald|purple|violet|fuchsia|amber|red|indigo|slate)-(50|100|500|600|700)/,
      variants: ['hover', 'group-hover'],
    },
    {
      pattern: /text-(blue|emerald|purple|violet|fuchsia|amber|red|indigo|slate)-(400|500|600|700|800)/,
    },
    {
      pattern: /border-(blue|emerald|purple|violet|fuchsia|amber|red|indigo|slate)-(100|200|300|500)/,
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