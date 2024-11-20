/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
import tailwindcssAnimated from "tailwindcss-animated";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui, tailwindcssAnimated],
};
