// tailwind.config.js
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  extend: {
   fontFamily: {
        sans: ["var(--font-poppins)", "sans-serif"], // default global font
        inter: ["var(--font-inter)", "sans-serif"],
        bodoni: ["var(--libre_bodoni)", "serif"],
        geist: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
  },
},

  plugins: [],
};
