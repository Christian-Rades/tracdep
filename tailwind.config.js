/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        background: '#E8E6E1',
        "background-light": '#FAF9F7',
        text: '#27241D',
        divider: '#D3CEC4',
        add: '#87EAF2',
        delete: '#F29B9B',
        accept: '#8EEDC7',
      },
    },
  },
  plugins: [],
}

