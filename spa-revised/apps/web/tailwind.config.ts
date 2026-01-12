import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: '#C7DCC8',
        cream: '#FAF8F3',
        charcoal: '#2C2C2C',
        taupe: '#D4B5A0',
        'soft-peach': '#F4D9C8',
        'soft-lavender': '#E8DDF0',
        'soft-mint': '#D9E8DC',
        'soft-rose': '#F0D9E8',
        'soft-gray': '#E5E5E5',
      },
      fontFamily: {
        display: ['Sohne', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['56px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        display: ['48px', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display-sm': ['40px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'section-xl': ['32px', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.01em' }],
        section: ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'section-sm': ['24px', { lineHeight: '1.35', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '500' }],
        body: ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        small: ['14px', { lineHeight: '1.5', fontWeight: '500' }],
        'xs': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        button: '8px',
        card: '16px',
      },
      boxShadow: {
        'card-sm': '0px 2px 4px rgba(0, 0, 0, 0.05)',
        card: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        'card-lg': '0px 8px 24px rgba(0, 0, 0, 0.12)',
        'card-xl': '0px 12px 32px rgba(0, 0, 0, 0.15)',
        'hover': '0px 6px 16px rgba(0, 0, 0, 0.1)',
        'hover-lg': '0px 12px 32px rgba(0, 0, 0, 0.15)',
      },
      backgroundImage: {
        'gradient-soft': 'linear-gradient(135deg, rgba(199, 220, 200, 0.08) 0%, rgba(244, 217, 200, 0.05) 100%)',
        'gradient-sage': 'linear-gradient(135deg, #C7DCC8 0%, #A8C9A8 100%)',
        'gradient-subtle': 'linear-gradient(180deg, rgba(250, 248, 243, 0) 0%, rgba(199, 220, 200, 0.04) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

export default config