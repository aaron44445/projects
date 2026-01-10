/**
 * Pecase Design System - Tailwind Configuration Preset
 * Soft pastel colors, modern minimal aesthetic
 * Based on Dribbble design reference
 */

module.exports = {
  theme: {
    extend: {
      // Color palette - Soft, calming colors
      colors: {
        // Primary colors
        sage: {
          DEFAULT: '#C7DCC8',
          50: '#F5F8F6',
          100: '#EBF1ED',
          200: '#D7E5DA',
          300: '#C7DCC8',
          400: '#A8CFAA',
          500: '#8FA98C',
          600: '#5A8C52',
          700: '#3D6335',
        },
        cream: {
          DEFAULT: '#FAF8F3',
          50: '#FFFEF9',
          100: '#FAF8F3',
          200: '#F5F1E8',
        },
        charcoal: {
          DEFAULT: '#2C2C2C',
          50: '#F8F8F8',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#999999',
          400: '#666666',
          500: '#444444',
          600: '#2C2C2C',
        },
        taupe: {
          DEFAULT: '#D4B5A0',
          50: '#F9F6F2',
          100: '#F2EBE1',
          200: '#E5D6C8',
          300: '#D4B5A0',
          400: '#C0956F',
        },

        // Soft accent palette
        peach: {
          DEFAULT: '#F4D9C8',
          light: '#F9ECE1',
        },
        lavender: {
          DEFAULT: '#E8DDF0',
          light: '#F3EEF8',
        },
        mint: {
          DEFAULT: '#D9E8DC',
          light: '#EAF3EC',
        },
        rose: {
          DEFAULT: '#F0D9E8',
          light: '#F8ECF4',
        },

        // Status colors
        success: '#8FA98C',
        pending: '#D4A574',
        cancelled: '#C97C7C',
        noshow: '#999999',

        // Semantic colors
        error: '#C97C7C',
        warning: '#D4A574',
        info: '#C7DCC8',
      },

      // Typography
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'serif'],
      },
      fontSize: {
        // Type scale based on PRD
        xs: ['12px', { lineHeight: '16px', letterSpacing: '0px' }],
        sm: ['14px', { lineHeight: '20px', letterSpacing: '0px' }],
        base: ['14px', { lineHeight: '20px', letterSpacing: '0px' }],
        lg: ['18px', { lineHeight: '28px', letterSpacing: '0px' }],
        xl: ['24px', { lineHeight: '32px', letterSpacing: '0px' }],
        '2xl': ['32px', { lineHeight: '40px', letterSpacing: '0px' }],
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },

      // Spacing - base unit 8px
      spacing: {
        0: '0',
        1: '2px',
        2: '4px',
        3: '8px',
        4: '12px',
        5: '16px',
        6: '20px',
        7: '24px',
        8: '32px',
        9: '40px',
        10: '48px',
        11: '56px',
        12: '64px',
        13: '72px',
        14: '80px',
        15: '88px',
        16: '96px',
      },

      // Border radius
      borderRadius: {
        none: '0',
        sm: '4px',
        button: '8px',
        md: '8px',
        card: '12px',
        lg: '16px',
        full: '9999px',
      },

      // Box shadows
      boxShadow: {
        none: 'none',
        xs: '0px 1px 2px rgba(0, 0, 0, 0.05)',
        sm: '0px 2px 4px rgba(0, 0, 0, 0.08)',
        card: '0px 2px 8px rgba(0, 0, 0, 0.08)',
        md: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        lg: '0px 8px 24px rgba(0, 0, 0, 0.12)',
        modal: '0px 20px 60px rgba(0, 0, 0, 0.15)',
        hover: '0px 4px 12px rgba(0, 0, 0, 0.12)',
      },

      // Animations and transitions
      animation: {
        fadeIn: 'fadeIn 300ms ease-in-out forwards',
        slideUp: 'slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin: 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },

      // Transition durations
      transitionDuration: {
        150: '150ms',
        300: '300ms',
        400: '400ms',
      },

      // Container sizing
      maxWidth: {
        '1400px': '1400px',
      },

      // Z-index scale
      zIndex: {
        auto: 'auto',
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        dropdown: '1000',
        sticky: '1100',
        fixed: '1200',
        modalBackdrop: '1300',
        modal: '1400',
        popover: '1500',
        tooltip: '1600',
      },

      // Line heights
      lineHeight: {
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        7: '1.75rem',
        8: '2rem',
        9: '2.25rem',
        10: '2.5rem',
      },

      // Letter spacing
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },

      // Opacity
      opacity: {
        0: '0',
        5: '0.05',
        10: '0.1',
        20: '0.2',
        25: '0.25',
        30: '0.3',
        40: '0.4',
        50: '0.5',
        60: '0.6',
        70: '0.7',
        75: '0.75',
        80: '0.8',
        90: '0.9',
        95: '0.95',
        100: '1',
      },
    },
  },

  // Plugin configuration
  plugins: [],
}
