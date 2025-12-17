/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
  safelist: [
    // Colores para componentes dinámicos
    'from-blue-500', 'to-blue-600', 'bg-blue-50', 'text-blue-900', 'border-blue-200',
    'from-emerald-500', 'to-emerald-600', 'bg-emerald-50', 'text-emerald-900', 'border-emerald-200',
    'from-purple-500', 'to-purple-600', 'bg-purple-50', 'text-purple-900', 'border-purple-200',
    'from-amber-500', 'to-amber-600', 'bg-amber-50', 'text-amber-900', 'border-amber-200',
    'from-indigo-500', 'to-indigo-600', 'bg-indigo-50', 'text-indigo-900', 'border-indigo-200',
    'from-red-500', 'to-red-600', 'bg-red-50', 'text-red-900', 'border-red-200',
    'from-slate-500', 'to-slate-600', 'bg-slate-50', 'text-slate-900', 'border-slate-200',
    'text-blue-600', 'text-emerald-600', 'text-purple-600', 'text-amber-600',
    'text-red-600', 'text-indigo-600', 'text-pink-600',
  ]
};
