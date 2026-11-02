/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#080808',
        card: '#151515',
        field: '#111111',
        raised: '#1a1a1a',
        lift: '#242424',
        fg: { DEFAULT: '#f4efe8', soft: '#d6cfc4' },
        muted: '#a39d94',
        faint: '#6d675f',
        brand: { DEFAULT: '#FE9E15', hover: '#ffae3d', soft: 'rgba(254,158,21,0.14)' },
        mint: { DEFAULT: '#38d996', soft: 'rgba(56,217,150,0.14)' },
        line: 'rgba(255,255,255,0.11)',
        danger: '#ff6b5e',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"DM Sans"', 'sans-serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
    },
  },
  plugins: [],
}
