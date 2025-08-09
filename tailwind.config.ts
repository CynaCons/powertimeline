import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'space-black': '#0d0d18',
        'nebula-purple': '#6d28d9',
        'star-blue': '#0ea5e9',
      },
    },
  },
  plugins: [],
} satisfies Config;
