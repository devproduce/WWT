/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--color-brand)',
          dark: 'var(--color-brand-dark)',
          on: 'var(--color-brand-on)',
        },
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        line: 'var(--color-line)',
        panel: 'var(--color-panel)',
        canvas: 'var(--color-canvas)',
        sidebar: 'var(--color-sidebar)',
        surface: 'var(--color-surface)',
        'surface-high': 'var(--color-surface-high)',
      },
    },
  },
  plugins: [],
}
