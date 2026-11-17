/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          main: '#0B0F19',
          secondary: '#111827',
          panel: '#161D2B',
          hover: '#1E293B',
          active: '#243044',
        },
        accent: {
          primary: '#6366F1',
          'primary-hover': '#4F46E5',
          secondary: '#8B5CF6',
          'secondary-hover': '#7C3AED',
        },
        content: {
          main: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
        },
        status: {
          success: '#22C55E',
          error: '#EF4444',
          warning: '#F59E0B',
          info: '#3B82F6',
        },
        border: {
          subtle: '#1E293B',
          light: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -3px rgba(99, 102, 241, 0.25)',
        'glow-secondary': '0 0 20px -3px rgba(139, 92, 246, 0.25)',
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
