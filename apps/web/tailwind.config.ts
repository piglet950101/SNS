import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

/**
 * Postari brand palette — locked per 確定仕様書 v2.0 §11.
 *
 * Coral orange, not Tailwind's default orange (which is more saturated). Picked
 * to differentiate from Buffer/Hootsuite's blue palette.
 *   primary      = #FF6B4A  (CTAs, links, active states)
 *   primary-400  = #FF9070  (hover)
 *   primary-50   = #FEF0EC  (badges, card highlights)
 *   primary-700  = #C94A2A  (text emphasis, borders on accent)
 *   navy         = #1A1A2E  (body text, footer bg)
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B4A',
          foreground: '#FFFFFF',
          50: '#FEF0EC',
          100: '#FDE1D8',
          200: '#FBC2B0',
          300: '#FFB19A',
          400: '#FF9070',
          500: '#FF6B4A',
          600: '#E45A3C',
          700: '#C94A2A',
          800: '#9C3A1F',
          900: '#6E2915',
        },
        accent: '#FF9070',
        border: '#E5E7EB',
        input: '#E5E7EB',
        ring: '#FF6B4A',
        background: '#FFFFFF',
        foreground: '#1A1A2E',
        navy: '#1A1A2E',
        muted: { DEFAULT: '#F3F4F6', foreground: '#6B7280' },
        card: { DEFAULT: '#FFFFFF', foreground: '#1A1A2E' },
        destructive: { DEFAULT: '#DC2626', foreground: '#FFFFFF' },
        success: '#16A34A',
        warning: '#F59E0B',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        // LP uses Hiragino Kaku Gothic ProN first; app uses Noto Sans JP first.
        // Both stacks fall through to each other, so we pick Hiragino first
        // for a warmer Japanese rendering, then Noto Sans JP (loaded via next/font).
        sans: [
          'Hiragino Kaku Gothic ProN',
          'Hiragino Sans',
          'var(--font-noto-sans-jp)',
          '-apple-system',
          'BlinkMacSystemFont',
          'Yu Gothic UI',
          'Meiryo',
          'sans-serif',
        ],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out',
        'slide-up': 'slide-up 220ms ease-out',
      },
    },
  },
  plugins: [animate],
}

export default config
