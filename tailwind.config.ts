import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        teal: 'rgb(var(--c-teal) / <alpha-value>)',
        aqua: 'rgb(var(--c-aqua) / <alpha-value>)',
        deep: 'rgb(var(--c-deep) / <alpha-value>)',
        love: 'rgb(var(--c-love) / <alpha-value>)',
        sun: 'rgb(var(--c-sun) / <alpha-value>)',
        text: 'rgb(var(--c-text) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
        display: ['var(--font-fredoka)', 'var(--font-nunito)', 'sans-serif']
      },
      borderRadius: {
        card: '1.5rem',
        pill: '999px'
      },
      boxShadow: {
        soft: '0 18px 50px -18px rgb(var(--c-shadow) / 0.45)',
        glow: '0 0 0 4px rgb(var(--c-primary) / 0.15)',
        pop: '0 10px 30px -10px rgb(var(--c-primary) / 0.5)'
      },
      keyframes: {
        bob: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        drift: {
          '0%,100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(14px)' }
        },
        floatUp: {
          '0%': { transform: 'translateY(0) scale(0.6)', opacity: '0' },
          '15%': { opacity: '0.9' },
          '100%': { transform: 'translateY(-120vh) scale(1.1)', opacity: '0' }
        },
        wobble: {
          '0%,100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-6deg)' },
          '75%': { transform: 'rotate(6deg)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' }
        }
      },
      animation: {
        bob: 'bob 2.4s ease-in-out infinite',
        drift: 'drift 7s ease-in-out infinite',
        wobble: 'wobble 1.2s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite'
      }
    }
  },
  plugins: []
};

export default config;
