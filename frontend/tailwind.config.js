const anyChar = '*'

export default {
  content: [
    "./index.html",
    `./src/${anyChar}.{js,ts,jsx,tsx}`,
    `./src/components/${anyChar}.{js,ts,jsx,tsx}`,
    `./src/services/${anyChar}.{js,ts,jsx,tsx}`
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        actuaria: {
          50: 'rgb(240, 247, 255)',
          100: 'rgb(224, 239, 254)',
          200: 'rgb(186, 224, 253)',
          300: 'rgb(124, 200, 251)',
          400: 'rgb(54, 171, 246)',
          500: 'rgb(12, 143, 233)',
          600: 'rgb(1, 112, 199)',
          700: 'rgb(2, 89, 161)',
          800: 'rgb(6, 76, 132)',
          900: 'rgb(11, 63, 111)',
          950: 'rgb(7, 40, 73)',
        }
      }
    },
  },
  plugins: [],
}
