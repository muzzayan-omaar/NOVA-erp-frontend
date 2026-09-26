export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
  wiggle: {
    '0%, 100%': { transform: 'rotate(0deg)' },
    '75%': { transform: 'rotate(0deg)' },
    '80%': { transform: 'rotate(12deg)' },
    '85%': { transform: 'rotate(-10deg)' },
    '90%': { transform: 'rotate(6deg)' },
    '95%': { transform: 'rotate(0deg)' },
  },
},
animation: {
  wiggle: 'wiggle 2.5s ease-in-out infinite',
},
      colors: {
  nova: {
    950: '#0A1628',
    900: '#0F1B33',
    800: '#16233F',
    700: '#1E2E4D',
    cyan: '#22D3EE',
    blue: '#2563EB',
    'blue-dark': '#1E40AF',
  },
},
backgroundImage: {
  'nova-gradient': 'linear-gradient(135deg, #22D3EE 0%, #2563EB 60%, #1E40AF 100%)',
},
boxShadow: {
  'nova': '0 10px 40px -10px rgba(15, 27, 51, 0.35)',
},
    },
  },
  plugins: [],
}