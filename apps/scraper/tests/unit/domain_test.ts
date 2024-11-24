import { assertEquals } from '@std/assert/equals';
import type { EventPayload } from '../../src/domain.ts';

Deno.test('instantiate create event', () => {
    const createCmd: EventPayload['RESEARCHER_FOUND'] = {
        identifier: { type: 'idGithub', value: 'alice12345' },
    };
    assertEquals(createCmd.identifier.type, 'idGithub');
});

// Deno.test('instantiate add detail event', () => {
//     const addDetailCmd: Events['RESEARCHER_DETAIL_ADDED'] = {
//         identifier: { type: 'idGithub', value: 'alice12345' },
//         update: { type: 'idOrc', value: 'ecila54321' },
//     };
//     assertEquals(addDetailCmd.update.value, 'ecila54321');
// });

// Deno.test('link events', () => {
//     const addDetailCmd: Events['RESEARCHER_PUBLICATION_LINKED'] = {
//         source: { type: 'idGithub', id: 'alice12345' },
//         target: { type: 'idDoi', id: 'doidoidoi' },
//     };
//     assertEquals(addDetailCmd.source.id, 'alice12345');
//     assertEquals(addDetailCmd.target?.id, 'doidoidoi');
// });
