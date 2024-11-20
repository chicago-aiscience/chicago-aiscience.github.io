/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                primary: '#FFFFFF',
                secondary: '#F3F4F6',
                accent: '#00AAEE',
                text: {
                    DEFAULT: '#333333',
                    muted: '#555555',
                },
            },
            spacing: {
                sm: '0.5rem',
                md: '1rem',
                lg: '3rem',
            },
            width: {
                sidebar: '220px',
            },
            maxWidth: {
                content: '800px',
            },
            height: {
                header: '60px',
            },
            fontFamily: {
                roboto: ['Roboto'],
            },
            fontSize: {
                base: '16px',
            },
            lineHeight: {
                normal: '1.7',
                header: '1.2',
            },
        },
    },
    plugins: [],
};
