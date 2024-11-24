/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['./tests/**/*.ts'],
        exclude: ['./tests/fixtures/*'],
        coverage: {
            provider: 'istanbul',
            reportsDirectory: '../../coverage/site/',
            reporter: ['text', 'lcov', 'html'],
        },
    },
});
