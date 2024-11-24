import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'main.ts',
            fileName: 'main',
            formats: ['es'],
        },
        outDir: '../../dist/scraper/',
        emptyOutDir: true,
    },
});
