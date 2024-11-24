/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                primary: '#FFFFFF',
                secondary: '#dadbdd',
                accent: '#FFF',
                surface: '#fafafb',
                text: "#222",
                muted: '#555',
            },
            fontFamily: {
                roboto: ['Roboto'],
            },
        },
    },
    plugins: [],
};
