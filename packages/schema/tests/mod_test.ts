import { PublicationSchema } from '../mod.ts';
import { FellowSchema, ResearcherSchema } from '../mod.ts';
import { assert, assertEquals } from '@std/assert';

Deno.test('researcher schema validation', () => {
    const researcher = ResearcherSchema.parse({
        name: 'Alice Cooper',
    });
    assertEquals(researcher.name, 'Alice Cooper');
    assertEquals(researcher.idGithub, []);
});

Deno.test('fellow schema validation', () => {
    const fellow = FellowSchema.safeParse({
        name: 'Bob Dylan',
        idCohort: '3',
        idGithub: ['testgit'],
    });
    assert(fellow.success)
    assertEquals(fellow.data.idCohort, '3');
    assertEquals(fellow.data.idGithub, ['testgit']);
});

Deno.test('publication schema validation', () => {
    const paper = PublicationSchema.safeParse({
        title: 'Awesome Science',
        idDoi: '11.574/3938',
        name: 'Lucas',
    });
    assert(paper.success)
    assertEquals(paper.data.title, 'Awesome Science');
    assertEquals(paper.data.idDoi, '11.574/3938');
    assertEquals(paper.data.metaVenue, []);
});
