/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14213d',
        navy: '#19324d',
        blue: '#2457d6',
        paper: '#f7f8fb',
        line: '#dce2ea',
        muted: '#64748b',
        success: '#16794b',
        warning: '#9a5b13',
        danger: '#b43c45',
      },
      boxShadow: {
        panel: '0 12px 30px rgba(20, 33, 61, 0.07)',
      },
    },
  },
  plugins: [],
}
