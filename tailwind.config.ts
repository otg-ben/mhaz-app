import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './contexts/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        base: '#0d1117',
        surface: '#161b22',
        elevated: '#21262d',
        border: '#30363d',
        // Text
        primary: '#e6edf3',
        secondary: '#8b949e',
        muted: '#6e7681',
        // Alert type colors
        leo: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          bg: '#0f1f3d',
          border: '#1d4ed8',
          pin: '#4f8ef7',
        },
        trail: {
          DEFAULT: '#eab308',
          light: '#facc15',
          bg: '#2d2000',
          border: '#a16207',
          pin: '#fbbf24',
        },
        citation: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          bg: '#2d0000',
          border: '#991b1b',
          pin: '#ff5f57',
        },
        lostfound: {
          DEFAULT: '#22c55e',
          light: '#4ade80',
          bg: '#052e16',
          border: '#166534',
          pin: '#4ade80',
        },
        // Brand
        brand: {
          DEFAULT: '#3fb950',
          light: '#56d364',
          dark: '#1a7f37',
          muted: '#0d3a1a',
        },
        // MHAZ badge (email-sourced posts)
        mhaz: {
          DEFAULT: '#a371f7',
          bg: '#1e1040',
          border: '#6e40c9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'pin': '0 2px 8px rgba(0,0,0,0.6)',
        'modal': '0 25px 60px rgba(0,0,0,0.8)',
        'sheet': '0 -4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
