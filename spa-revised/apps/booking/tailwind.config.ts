import type { Config } from 'tailwindcss'
import defaultConfig from '@pecase/tailwind-config'

/**
 * Tailwind CSS configuration for Pecase Booking App
 * Extends the shared design system configuration
 * This is the customer-facing booking interface
 */

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  presets: [defaultConfig],
  theme: {
    extend: {
      // Booking app specific customizations
      // Can override or extend the preset values here
      // Example: More prominent primary colors for CTAs
    },
  },
  plugins: [
    // Add Tailwind plugins as needed
    // Example: require('@tailwindcss/forms')
  ],
}

export default config
