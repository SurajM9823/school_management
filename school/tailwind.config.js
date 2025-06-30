/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#167F92',  
        darkPrimary:'rgb(22 97 110)', 
        lightPrimary:'rgb(106 166 177 / 30%)',       
      },
    },
  },
  plugins: [],
};
