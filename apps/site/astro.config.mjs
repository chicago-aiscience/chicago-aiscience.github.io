// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';

import tailwind from '@astrojs/tailwind';

export default defineConfig({
    site: 'https://chicago-aiscience.github.io',
    srcDir: './src/',
    outDir: '../../dist/',
    output: 'static',

    image: {
        service: passthroughImageService(), // default image service uses Sharp which breaks deployment
    },

    integrations: [tailwind()],

    vite: {
        server: {
            fs: {
                allow: ['./src/', './src/content/', '../../node_modules/'],
            },
        },
    },
});
