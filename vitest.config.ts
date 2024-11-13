/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
    test: {
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        globals: false,
    },
    // resolve: {
    //   alias: {
    //     '@': new URL("src", import.meta.url).pathname
    //   }
    // }
});
