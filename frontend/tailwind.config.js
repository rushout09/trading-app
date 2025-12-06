/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sheet': {
          'bg': '#1e1e1e',
          'header': '#2d2d2d',
          'row': '#252526',
          'row-alt': '#2a2a2a',
          'border': '#3e3e42',
          'text': '#cccccc',
          'text-muted': '#808080',
          'accent': '#0e639c',
          'accent-hover': '#1177bb',
          'positive': '#4ec9b0',
          'negative': '#f14c4c',
          'tab': '#2d2d2d',
          'tab-active': '#1e1e1e',
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}

