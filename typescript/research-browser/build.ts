import { bundle } from 'jsr:@deno/emit';
import { dirname, fromFileUrl, join } from 'jsr:@std/path';

const version = '0.1.1';

const entrypoint = join(dirname(import.meta.url), './src/index.ts');
const outpath = join(
    dirname(fromFileUrl(import.meta.url)),
    '../../dist/typescript/research-browser/bundle-v' + version + '.js',
);

const jsBundle = await bundle(entrypoint, { importMap: './deno.jsonc' });

await Deno.mkdir(dirname(outpath), { recursive: true });
await Deno.writeTextFile(outpath, jsBundle.code);

console.log(`Bundle created at ${outpath}`);
