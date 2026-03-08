/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#7c3aed', 50: '#f5f3ff', 100: '#ede9fe', 500: '#7c3aed', 600: '#6d28d9', 700: '#5b21b6', 900: '#4c1d95' },
        accent:   { DEFAULT: '#ec4899', 500: '#ec4899', 600: '#db2777' },
        surface:  { DEFAULT: '#0f0f0f', 50: '#1a1a2e', 100: '#16213e', 200: '#1a1a2e', card: '#1e1e2e', hover: '#252535' },
        brand:    { purple: '#7c3aed', pink: '#ec4899', blue: '#3b82f6' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow':  'spin 4s linear infinite',
        'equalizer':  'equalizer 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 },                 to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        equalizer: { '0%, 100%': { height: '4px' }, '50%': { height: '20px' } },
      },
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient':     'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
        'card-gradient':     'linear-gradient(145deg, #1e1e2e, #252535)',
        'purple-gradient':   'linear-gradient(135deg, #7c3aed, #ec4899)',
        'player-gradient':   'linear-gradient(to top, #0a0a0a, #111111)',
      },
    },
  },
  plugins: [],
}
