import { assertEquals } from '@std/assert/equals';
import type { Events } from './domain.ts';

Deno.test('instantiate create event', () => {
    const createCmd: Events['RESEARCHER_CREATED'] = {
        name: 'Alice',
        identifier: { type: 'idGithub', id: 'alice12345' },
    };
    assertEquals(createCmd.identifier.type, 'idGithub');
});

Deno.test('instantiate add detail event', () => {
    const addDetailCmd: Events['RESEARCHER_DETAIL_ADDED'] = {
        known: { type: 'idGithub', id: 'alice12345' },
        fresh: { type: 'idOrc', id: 'ecila54321' },
    };
    assertEquals(addDetailCmd.fresh.id, 'ecila54321');
});

Deno.test('link events', () => {
    const addDetailCmd: Events['RESEARCHER_PUBLICATION_LINKED'] = {
        source: { type: 'idGithub', id: 'alice12345' },
        target: { type: 'idDoi', id: 'doidoidoi' },
    };
    assertEquals(addDetailCmd.source.id, 'alice12345');
    assertEquals(addDetailCmd.target?.id, 'doidoidoi');
});
