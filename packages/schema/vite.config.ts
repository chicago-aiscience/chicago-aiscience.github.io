import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: './mod.ts',
            fileName: 'mod',
            formats: ['es'],
        },
        outDir: '../../dist/schema',
        emptyOutDir: true,
    },
});
