
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        card: "#ffffff",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
