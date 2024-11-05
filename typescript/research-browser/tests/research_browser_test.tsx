import { assert, assertEquals } from '@std/assert';
import { Document, Window } from 'happy-dom';
import { act } from '@testing-library/react';
import { ResearchBrowser } from '../src/research-browser.tsx';

const window = new Window();

declare global {
    interface globalThis {
        document: Document;
        HTMLElement: typeof window.HTMLElement;
        [key: string]: unknown;
    }
}

// general browser
// @ts-ignore: dom test setup
globalThis.window = window;
// @ts-ignore: dom test setup
globalThis.document = window.document;
// @ts-ignore: dom test setup
globalThis.HTMLElement = window.HTMLElement;
// @ts-ignore: dom test setup
globalThis.customElements = window.customElements;

// await import('../src/research-browser.tsx');
customElements.define('research-browser', ResearchBrowser);

Deno.test('custom browser element registers properly', () => {
    assertEquals(customElements.get('research-browser')?.name, 'ResearchBrowser');
});

// TODO: this leaks not sure why exactly -- happy dom?
Deno.test('custom browser element renders a react root', async () => {
    // setup component
    const element = document.createElement('research-browser') as ResearchBrowser;
    element.setAttribute('type', 'items');
    document.body.appendChild(element);

    await act(() => Promise.resolve());
    assert(element.root !== undefined);
    document.body.removeChild(element);
});

// TODO: this leaks not sure why exactly -- happy dom?
Deno.test('custom browser element renders type in title', async () => {
    // setup component
    const element = document.createElement('research-browser') as ResearchBrowser;
    element.setAttribute('type', 'items');
    element.setAttribute('title', 'Items');
    document.body.appendChild(element);

    await act(() => Promise.resolve());
    const titleElement = element.querySelector('h2');
    assertEquals(titleElement?.innerText, 'Items');
    document.body.removeChild(element);
});
