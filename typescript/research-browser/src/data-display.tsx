import * as React from 'react';
import { useEffect, useState } from 'react';
import { fetchJsonl } from './utils.ts';

type DisplayPattern<T = unknown> = {
    renderItem: (item: T, idx?: number) => React.ReactNode;
    wrapper: (items: React.ReactNode[]) => JSX.Element;
};

export interface DataDisplayProps<T> {
    items: T[];
    pattern?: DisplayPattern<T>;
    title?: string;
}

const listPattern = <T,>(): DisplayPattern<T> => ({
    renderItem: (item, idx) => <li key={idx}>{JSON.stringify(item)}</li>,
    wrapper: (items) => <ul>{items}</ul>,
});

export const DataDisplay = <T,>(
    { items, title, pattern = listPattern<T>() }: DataDisplayProps<T>,
) => (
    <>
        {title && <h2>{title}</h2>}
        {pattern.wrapper(items.map((item, idx) => pattern.renderItem(item, idx)))}
    </>
);

export interface BrowserDisplayProps<T> {
    type: string;
    pattern?: DisplayPattern<T>;
    title?: string;
}

export const BrowserDisplay = <T,>({ type, title, pattern }: BrowserDisplayProps<T>) => {
    const [items, setItems] = useState<T[]>([]);
    const url = `_static/data/${type}.jsonl`;

    useEffect(() => {
        (async () => {
            for await (const item of fetchJsonl<T>(url)) {
                setItems((prev: T[]) => [...prev, item]);
            }
        })();
    }, [url]);

    const displayProps = {
        items,
        ...(pattern !== undefined && { pattern }),
        ...(title !== undefined && { title }),
    };

    return <DataDisplay<T> {...displayProps} />;
};
