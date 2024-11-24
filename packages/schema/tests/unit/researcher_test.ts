import { assertEquals } from '@std/assert/equals';
import { researcherInitSchema } from '../../mod.ts';

Deno.test('researcher init schema', async (t) => {
    await t.step('empty input creates arrays', () => {
        const empty = researcherInitSchema.parse({});
        assertEquals(empty.idGithub, []);
        assertEquals(empty.refPublicationDoi, []);
        assertEquals(empty.metaName, []);
        assertEquals(empty.metaImageUrl, []);
    });

    await t.step('aliases and main fields are merged', () => {
        const result = researcherInitSchema.parse({
            name: 'Test',
            githubUser: 'gh1',
            idGithub: ['gh2'],
        });
        assertEquals(result.metaName, ['Test']);
        assertEquals(result.idGithub, ['gh2', 'gh1']);
    });

    await t.step('aliases take arrays', () => {
        const result = researcherInitSchema.parse({
            name: ['test1', 'test2'],
            githubUser: ['user1', 'user2'],
        });

        assertEquals(result.metaName, ['test1', 'test2']);
        assertEquals(result.idGithub, ['user1', 'user2']);
    });

    await t.step('fields are mapped in order', () => {
        const result = researcherInitSchema.parse({
            githubUser: ['user 1', 'user 2'],
            idGithub: 'user 3',
            name: ['name1'],
            metaName: 'name2',
        });

        assertEquals(result.idGithub, ['user 3', 'user 1', 'user 2']);
        assertEquals(result.metaName, ['name2', 'name1']);
    });
});
