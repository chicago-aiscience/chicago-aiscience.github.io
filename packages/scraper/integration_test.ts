import { assert } from '@std/assert';

export function loadFellowsConfig(): Promise<string> {
    return Deno.readTextFile(new URL('../../configs/fellows.json', import.meta.url));
}

Deno.test('can read fellows config file', async () => {
    const configData = await loadFellowsConfig();
    const config = JSON.parse(configData);

    assert(config.length > 0);
});
