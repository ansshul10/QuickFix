// quickfix-website/client/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // <--- CRITICAL: Ensures Tailwind scans all your React files
    "./public/index.html",
  ],
  darkMode: 'class', // Enable dark mode based on 'dark-mode' class on html/body
  theme: {
    extend: {
      colors: {
        // Define your custom colors using CSS variables from variables.css
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        cardBackground: 'var(--color-card-background)',
        textDefault: 'var(--color-text-default)',
        textSecondary: 'var(--color-text-secondary)',
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
        warning: 'var(--color-warning)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),      // Adds form styling
    require('@tailwindcss/typography'), // Adds typography styles
  ],
}