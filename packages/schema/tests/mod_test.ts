import { publicationSchema, researcherSchema } from '../mod.ts';
import { assert, assertEquals } from '@std/assert';

Deno.test('researcher schema validation', () => {
    const researcher = researcherSchema.parse({
        metaName: 'Alice Cooper',
    });
    assertEquals(researcher.metaName, 'Alice Cooper');
});

// Deno.test('profile schema validation', () => {
//     const fellow = profileSchema.safeParse({
//         metaName: 'Bob Dylan',
//         idGithub: ['testgit'],
//     });
//     assert(fellow.success);
//     assertEquals(fellow.data.idGithub, ['testgit']);
// });

Deno.test('publication schema validation', () => {
    const paper = publicationSchema.safeParse({
        metaTitle: 'Awesome Science',
        idDoi: '11.574/3938',
        metaName: 'Lucas',
    });
    assert(paper.success);
    assertEquals(paper.data.metaTitle, 'Awesome Science');
    assertEquals(paper.data.idDoi, '11.574/3938');
});
