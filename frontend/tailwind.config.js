/** @type {import('tailwindcss').Config} */
export default {
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
          DEFAULT: '#0f766e',
          dark: '#115e59',
        },
        ink: '#12312e',
        muted: '#5b746f',
        line: '#cfe0db',
        panel: '#f4faf7',
        canvas: '#e7f1ee',
        sidebar: '#0f3d38',
      },
    },
  },
  plugins: [],
}
