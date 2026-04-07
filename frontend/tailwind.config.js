/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Expense status colors
        draft: '#6b7280',
        submitted: '#3b82f6',
        approved: '#22c55e',
        rejected: '#ef4444',
        paid: '#8b5cf6',
      },
    },
  },
  plugins: [],
}
