import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f8f7',
          100: '#d9ebe8',
          500: '#3b7f77',
          700: '#2f625c',
          900: '#1f3f3b'
        }
      }
    }
  },
  plugins: []
};

export default config;
