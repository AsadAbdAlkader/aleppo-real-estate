/**
 * ══════════════════════════════════════════════════════════════
 * ALEPPO REAL ESTATE — "Modern Heritage" Design Tokens
 * Palette: Champagne Gold · Deep Pine · Warm Greige · Ivory
 * Type:    Reem Kufi (display) · Tajawal (UI) · Playfair (Latin accents)
 * ══════════════════════════════════════════════════════════════
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand accent: Champagne Gold (remaps default `amber`) ──
        amber: {
          50: '#FCF9F1',
          100: '#F7EFDE',
          200: '#EFE0BF',
          300: '#E4CC96',
          400: '#D8B56B',
          500: '#C79C4A', // primary champagne
          600: '#AE8136',
          700: '#8C652C',
          800: '#6E4F25',
          900: '#5A411F',
          950: '#332412',
        },
        // ── Secondary accent: Deep Pine (remaps default `teal`) ──
        teal: {
          50: '#F1F6F3',
          100: '#E0ECE5',
          200: '#C1D9CC',
          300: '#9AC0AB',
          400: '#6FA189',
          500: '#528571',
          600: '#3E6B5B', // primary pine
          700: '#33564A',
          800: '#2B463D',
          900: '#243A33',
          950: '#121F1B',
        },
        // ── Neutral scale: warm greige (remaps default `slate`) ──
        slate: {
          50: '#F8F7F4',
          100: '#F0EEE8',
          200: '#E3E0D8',
          300: '#CFCCC2',
          400: '#ACA79B',
          500: '#8A8579',
          600: '#6E6A5F',
          700: '#57544B',
          800: '#403D37',
          900: '#2C2A25',
          950: '#191712', // warm near-black (dark surfaces)
        },
        // ── Page surfaces: ivory ──
        stone: {
          50: '#FAF8F3',
          100: '#F3F0E8',
          200: '#E9E4D9',
        },
        // ── Named brand tokens ──
        gold: {
          50: '#FCF9F1',
          100: '#F7EFDE',
          200: '#EFE0BF',
          300: '#E4CC96',
          400: '#D8B56B',
          500: '#C79C4A',
          600: '#AE8136',
          700: '#8C652C',
          800: '#6E4F25',
          900: '#5A411F',
        },
        ivory: {
          50: '#FDFCF9',
          100: '#FAF8F3',
          200: '#F3F0E8',
          300: '#E9E4D9',
        },
        ink: {
          700: '#3A372F',
          800: '#2C2A25',
          900: '#1F1D18',
          950: '#191712',
        },
        // ── Official Syrian Visual Identity Palette (جامعة الشمل) ──
        syria: {
          forest: '#054239',
          'forest-light': '#428177',
          'forest-dark': '#002623',
          gold: '#b9a779',
          'gold-muted': '#988561',
          cream: '#edebe0',
          umber: '#6b1f2a',
          'umber-deep': '#4a151e',
          'umber-dark': '#260f14',
          charcoal: '#161616',
          canvas: '#fdfbf7',
          card: '#ffffff',
          border: '#e5e0d8',
          flag: {
            green: '#007a3d',
            white: '#ffffff',
            black: '#000000',
            red: '#ce1126',
          }
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['HayyakumAllah', '"Reem Kufi"', 'Tajawal', 'system-ui', 'sans-serif'],
        hayyakum: ['HayyakumAllah', '"Reem Kufi"', 'Tajawal', 'system-ui', 'sans-serif'],
        latin: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(25,23,18,0.04), 0 10px 30px -18px rgba(25,23,18,0.18)',
        card: '0 1px 2px rgba(25,23,18,0.04), 0 18px 40px -24px rgba(25,23,18,0.28)',
        lift: '0 2px 6px rgba(25,23,18,0.06), 0 32px 64px -32px rgba(25,23,18,0.35)',
        'gold-sm': '0 6px 18px -8px rgba(199,156,78,0.55)',
        'gold-lg': '0 16px 40px -16px rgba(199,156,78,0.55)',
        'inner-hair': 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-quick': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'rise': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in-quick': 'fade-in-quick 0.35s ease both',
        'rise': 'rise 0.7s cubic-bezier(0.22,1,0.36,1) both',
        'shimmer': 'shimmer 1.8s linear infinite',
      },
    },
  },
  plugins: [],
}
