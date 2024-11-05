import * as React from 'react';
import { BrowserDisplay } from './data-display.tsx';
import { createRoot, Root } from 'react-dom/client';

export class ResearchBrowser extends HTMLElement {
    static observedAttributes = ['type'];
    root?: Root;

    connectedCallback() {
        const container = document.createElement('div');
        this.appendChild(container);
        this.root = createRoot(container);
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    disconnectedCallback() {
        this.root?.unmount();
    }

    private render() {
        const type = this.getAttribute('type') ?? undefined;
        if (type === undefined) {
            throw new Error('ResearchBrowser is missing a type');
        }
        const title = this.getAttribute('title') ?? undefined;

        const displayProps = {
            type,
            ...(title !== undefined && { title }),
        };

        this.root?.render(
            <BrowserDisplay {...displayProps} />,
        );
    }
}

// customElements.define('research-browser', ResearchBrowser);
