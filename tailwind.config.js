/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Higerian national palette (fictional country): Lagoon teal, Ember coral, Ivory.
        // Shades used for text/buttons meet WCAG AA contrast on white.
        primary: {
          50: '#edf7f6',
          100: '#d2ecea',
          200: '#a6d8d4',
          300: '#6fbcb6',
          400: '#3b9b94',
          500: '#1e817a',
          600: '#13706b', // 5.9:1 on white
          700: '#0e5c58', // Lagoon — flag field, 7.8:1 on white
          800: '#0a4845',
          900: '#073432',
        },
        accent: {
          50: '#fdf1ee',
          100: '#fadcd4',
          200: '#f4b8a9',
          300: '#ec8e78',
          400: '#e1674c',
          500: '#c4422a', // Ember — flag band, 5.0:1 on white
          600: '#a9351f',
          700: '#8c2b19',
          800: '#6f2214',
          900: '#52190f',
        },
        ivory: {
          DEFAULT: '#f3e9d2', // flag ring and fimbriation
          dark: '#e6d6b0',
        },
        ink: '#1b1f2a',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'Cambria', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      maxWidth: { content: '76rem' },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
