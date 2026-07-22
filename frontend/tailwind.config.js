/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        background: '#faf9f6',
        foreground: '#0f172a',
        border: '#e2e8f0',
        muted: '#f1f5f9',
        'muted-foreground': '#64748b',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 8s infinite linear',
        'float-iphone': 'float 6s ease-in-out infinite',
        'marquee': 'marquee 40s linear infinite',
        'marquee-reverse': 'marquee 40s linear infinite reverse',
        'spin-slow': 'spin 4s linear infinite',
        'move-grid': 'move-grid 15s linear infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(-5deg) rotateX(10deg)' },
          '50%': { transform: 'translateY(-20px) rotate(-2deg) rotateX(5deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'move-grid': {
          '0%': { transform: 'rotateX(60deg) translateY(0)' },
          '100%': { transform: 'rotateX(60deg) translateY(60px)' },
        },
      },
    },
  },
  plugins: [],
};
