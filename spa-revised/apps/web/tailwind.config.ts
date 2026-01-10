import type { Config } from 'tailwindcss'
import defaultConfig from '@pecase/tailwind-config'

/**
 * Tailwind CSS configuration for Pecase Web App
 * Extends the shared design system configuration
 */

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  presets: [defaultConfig],
  theme: {
    extend: {
      // Web app specific customizations
      // Can override or extend the preset values here
    },
  },
  plugins: [
    // Add Tailwind plugins as needed
    // Example: require('@tailwindcss/forms')
  ],
}

export default config
