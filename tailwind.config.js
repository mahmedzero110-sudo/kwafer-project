/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/views/**/*.ejs",
        "./src/public/js/**/*.js",
        "./src/server.js"
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#ec1363",
                "background-light": "#f8f6f7",
                "background-dark": "#221017",
                "gold": "#D4AF37",
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
        },
    },
    plugins: [],
}
