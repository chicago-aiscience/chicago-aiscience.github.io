import { assertEquals } from '@std/assert/equals';
import { fetchJsonl, mockStream } from '../src/utils.ts';

interface TestRecord {
    id: number;
    name?: string;
}

function mockFetch(chunks: string[]): Promise<Response> {
    const stream = mockStream(chunks);
    return Promise.resolve(new Response(stream));
}

Deno.test('fetches simple complete jsonl objects', async () => {
    globalThis.fetch = () =>
        mockFetch([
            '{"id":1}\n{"id":2}\n{"id":3}\n',
        ]);

    const results: TestRecord[] = [];
    for await (const item of fetchJsonl<TestRecord>('fakeurl')) {
        results.push(item);
    }

    assertEquals(results, [
        { id: 1 },
        { id: 2 },
        { id: 3 },
    ]);
});

Deno.test('fetches jsonl objects split over chunks', async () => {
    globalThis.fetch = () =>
        mockFetch([
            '{"id":1}\n{"',
            'id',
            '":2}\n{"id"',
            ':',
            '3}\n',
        ]);

    const results: TestRecord[] = [];
    for await (const item of fetchJsonl<TestRecord>('fakeurl')) {
        results.push(item);
    }

    assertEquals(results, [
        { id: 1 },
        { id: 2 },
        { id: 3 },
    ]);
});

Deno.test('fetches jsonl objects no line end', async () => {
    globalThis.fetch = () =>
        mockFetch([
            '{"id":1}\n{"id":2}\n{"id":3}',
        ]);

    const results: TestRecord[] = [];
    for await (const item of fetchJsonl<TestRecord>('fakeurl')) {
        results.push(item);
    }

    assertEquals(results, [
        { id: 1 },
        { id: 2 },
        { id: 3 },
    ]);
});

Deno.test('fetches jsonl objects break and optional field', async () => {
    globalThis.fetch = () =>
        mockFetch([
            '{"id":1}\n{"i',
            'd":2,    "name":"Chris"}\n{"id":3}',
        ]);

    const results: TestRecord[] = [];
    for await (const item of fetchJsonl<TestRecord>('fakeurl')) {
        results.push(item);
    }

    assertEquals(results, [
        { id: 1 },
        { id: 2, name: 'Chris' },
        { id: 3 },
    ]);
});
