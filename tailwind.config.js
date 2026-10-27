/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        darkSlate: '#0F172A',
        surfaceSlate: '#1E293B',
        borderSlate: '#334155',
        synergixCyan: '#0EA5E9',
        emeraldCall: '#10B981',
        crimsonEnd: '#EF4444',
      },
    },
  },
  plugins: [],
};
