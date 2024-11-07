// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';

export default defineConfig({
    site: 'https://chicago-aiscience.github.io/',
    output: 'static',
    image: {
        service: passthroughImageService(),
    }
});
