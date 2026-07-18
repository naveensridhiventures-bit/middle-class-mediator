/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1B2A4A",
          light: "#2D4373",
          dark: "#111B33",
        },
        paper: {
          DEFAULT: "#FAF6EF",
          dim: "#F0EAD9",
        },
        gold: {
          DEFAULT: "#C89B3C",
          light: "#E0B75C",
          dark: "#9C7726",
        },
        mediator: "#2D4373",
        seller: "#1F6F5C",
        buyer: "#B5533C",
        whatsapp: "#25D366",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["'Work Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        grain: "radial-gradient(#1B2A4A08 1px, transparent 1px)",
      },
      backgroundSize: {
        grain: "16px 16px",
      },
    },
  },
  plugins: [],
};
