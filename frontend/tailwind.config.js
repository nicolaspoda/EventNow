/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#0052CC',
            hover: '#003D99',
            light: '#4C9AFF',
          },
          secondary: {
            DEFAULT: '#5E6C84',
            hover: '#42526E',
          },
          success: {
            DEFAULT: '#00875A',
            hover: '#006644',
          },
          warning: {
            DEFAULT: '#FF8B00',
            hover: '#FF991F',
          },
          error: {
            DEFAULT: '#DE350B',
            hover: '#BF2600',
          },
          text: {
            primary: '#172B4D',
            secondary: '#5E6C84',
            disabled: '#A5ADBA',
          },
        },
      },
    },
    plugins: [],
  }