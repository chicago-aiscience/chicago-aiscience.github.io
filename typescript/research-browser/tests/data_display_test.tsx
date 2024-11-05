/// <reference lib="deno.ns" />

import * as React from 'react';
import { render } from '@testing-library/react';
import { assertEquals } from '@std/assert';
import { Document, Window } from 'happy-dom';
import { DataDisplay, DataDisplayProps } from '../src/data-display.tsx';

const window = new Window();

declare global {
    interface globalThis {
        document: Document;
        HTMLElement: typeof window.HTMLElement;
    }
}

// @ts-ignore: dom test setup
globalThis.window = window;
// @ts-ignore: dom test setup
globalThis.document = window.document;
// @ts-ignore: dom test setup
globalThis.HTMLElement = window.HTMLElement;

// Deno.test('message string passes to component', () => {
//     const items: { message: string }[] = [{ message: 'Hello, World!' }];

//     const browseProps: DataDisplayProps<{ message: string }> = { items };
//     const { getByText } = render(<DataDisplay {...browseProps} />);

//     assertEquals('Hello, World!', getByText('Hello, World!').innerText);
// });

// Deno.test('message string passes to component and lowercases', () => {
//     const items: { message: string }[] = [{ message: 'Hello, World!' }];

//     const browseProps: DataDisplayProps<{ message: string }> = { items };
//     const { getByText } = render(<DataDisplay {...browseProps} />);
//     assertEquals('Hello, World!', getByText('Hello, World!').innerText);
// });

// Deno.test('items are counted properly', () => {
//     const items = [1, 1, 1, 1, 1];
//     let idx = 0;
//     const renderItem = (_: number) => <p>Item {idx++}</p>;

//     const { container } = render(<DataDisplay {...{ items, renderItem }} />);
//     assertEquals(container.innerText.split('\n'), [
//         'Item 0',
//         'Item 1',
//         'Item 2',
//         'Item 3',
//         'Item 4',
//     ]);
// });

Deno.test('title displays when provided', () => {
    const { container } = render(<DataDisplay items={[]} title={'Research Browser: Items'} />);
    const containerTitle = container.querySelector('h2')!;
    assertEquals('Research Browser: Items', containerTitle.innerText);
});
