import type { Config } from "tailwindcss";

// Tailwind 4 uses CSS-first configuration in globals.css
// But we keep this for compatibility if tools expect it
export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
} satisfies Config;
