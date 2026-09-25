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