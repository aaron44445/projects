import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ============================================
      // PEACASE DESIGN SYSTEM - COLORS (IMPROVED CONTRAST)
      // ============================================
      colors: {
        // Primary Colors - Sage Green
        sage: {
          DEFAULT: '#7BA37C',
          dark: '#5A8A5B',
          light: '#A8C9A9',
          muted: '#C7DCC8',
        },

        // Background Colors
        cream: '#FAF8F3',
        charcoal: '#2C2C2C',
        sidebar: '#1A1A1A',

        // Accent Colors - More saturated for visibility
        peach: {
          DEFAULT: '#E8A87C',
          light: '#F4D9C8',
          dark: '#D4885A',
        },
        lavender: {
          DEFAULT: '#9B7BB8',
          light: '#D4C5E8',
          dark: '#7A5A98',
        },
        mint: {
          DEFAULT: '#6BAB8C',
          light: '#A8D4BC',
          dark: '#4A8A6C',
        },
        rose: {
          DEFAULT: '#C87A9C',
          light: '#E8B8CC',
          dark: '#A85A7C',
        },

        // Card/Surface Colors
        surface: {
          DEFAULT: '#FFFFFF',
          elevated: '#FFFFFF',
          muted: '#F5F3EE',
          dark: '#E8E4DC',
        },

        // Text Colors
        text: {
          primary: '#1A1A1A',
          secondary: '#4A4A4A',
          muted: '#7A7A7A',
          inverse: '#FFFFFF',
        },

        // Border Colors
        border: {
          DEFAULT: '#D4D0C8',
          light: '#E8E4DC',
          dark: '#B8B4AC',
        },

        // Status Colors - More visible
        success: '#4A9A5A',
        warning: '#D4944A',
        error: '#C45A5A',
        info: '#5A8AC4',
      },

      // ============================================
      // TYPOGRAPHY
      // ============================================
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'display-lg': ['56px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display': ['48px', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.02em' }],
        'display-sm': ['40px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'section-xl': ['32px', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.01em' }],
        'section': ['28px', { lineHeight: '1.3', fontWeight: '600' }],
        'section-sm': ['24px', { lineHeight: '1.35', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '500' }],
        'body': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        'small': ['14px', { lineHeight: '1.5', fontWeight: '500' }],
        'xs': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
      },

      // ============================================
      // SPACING (8px Grid)
      // ============================================
      spacing: {
        '13': '3.25rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },

      // ============================================
      // SHADOWS - More visible
      // ============================================
      boxShadow: {
        'soft': '0px 2px 8px rgba(0, 0, 0, 0.08)',
        'card': '0px 4px 16px rgba(0, 0, 0, 0.1)',
        'card-lg': '0px 8px 24px rgba(0, 0, 0, 0.12)',
        'card-xl': '0px 12px 32px rgba(0, 0, 0, 0.15)',
        'hover': '0px 8px 24px rgba(0, 0, 0, 0.12)',
        'hover-lg': '0px 16px 40px rgba(0, 0, 0, 0.18)',
        'inner-soft': 'inset 0px 2px 4px rgba(0, 0, 0, 0.06)',
      },

      // ============================================
      // BORDER RADIUS
      // ============================================
      borderRadius: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },

      // ============================================
      // ANIMATIONS
      // ============================================
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
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
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },

      // ============================================
      // BACKGROUND IMAGES
      // ============================================
      backgroundImage: {
        'gradient-soft': 'linear-gradient(135deg, rgba(123, 163, 124, 0.1) 0%, rgba(232, 168, 124, 0.08) 100%)',
        'gradient-sage': 'linear-gradient(135deg, #7BA37C 0%, #5A8A5B 100%)',
        'gradient-subtle': 'linear-gradient(180deg, rgba(250, 248, 243, 0) 0%, rgba(123, 163, 124, 0.06) 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};

export default config;
