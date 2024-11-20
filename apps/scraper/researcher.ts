import type { Events, ResearcherIdentifier, TheEvent } from './domain.ts';
import type { Detail, Researcher } from '../../packages/schema/mod.ts';

export interface Projection {
    apply(event: TheEvent): void;
    getState(): Map<string, Researcher>;
}

export class ResearcherAggregate {
    private state: Omit<Researcher, 'name'> & { name?: string } = {
        name: undefined,
        idGithub: [],
        idSemScholar: [],
        idOrc: [],
        refPublicationDoi: [],
        metaImageUrl: [],
        metaWebsite: [],
    };
    private changes: TheEvent[] = [];
    private version = 0;

    constructor(private id: string) {}

    apply<T extends keyof Events>(event: TheEvent<T>): void {
        switch (event.type) {
            case 'RESEARCHER_CREATED': {
                const payload = (event as TheEvent<'RESEARCHER_CREATED'>).payload;
                const { name, identifier } = payload;
                this.state.name = name;
                this.state[identifier.type].push(identifier.id);
                break;
            }
            case 'RESEARCHER_DETAIL_ADDED': {
                const payload = (event as TheEvent<'RESEARCHER_DETAIL_ADDED'>).payload;
                const { fresh } = payload;
                if (Array.isArray(this.state[fresh.type])) {
                    (this.state[fresh.type] as string[]).push(fresh.id);
                } else {
                    (this.state[fresh.type] as string) = fresh.id;
                }
                break;
            }
            case 'RESEARCHER_PUBLICATION_LINKED': {
                const payload = (event as TheEvent<'RESEARCHER_PUBLICATION_LINKED'>).payload;
                const { target } = payload;
                this.state.refPublicationDoi.push(target.id);
            }
        }
        this.version++;
    }

    load(events: TheEvent[]): void {
        events.forEach((event) => this.apply(event));
        this.version = events.length;
    }

    commit(): TheEvent[] {
        const events = [...this.changes];
        this.changes = [];
        return events;
    }

    create<T extends Researcher>(name: string, identifier: Detail<T>): void {
        if (this.state.name) throw new Error('Already exists');

        this.changes.push({
            id: String(this.version),
            type: 'RESEARCHER_CREATED',
            aggregateId: this.id,
            payload: { name, identifier },
            metadata: {
                timestamp: new Date(),
                sequence: this.version,
            },
        });
    }

    addIdentifier(known: ResearcherIdentifier, newId: ResearcherIdentifier): void {
        this.changes.push({
            id: String(this.version),
            type: 'RESEARCHER_DETAIL_ADDED',
            aggregateId: this.id,
            payload: { known, fresh: newId },
            metadata: {
                timestamp: new Date(),
                sequence: this.version,
            },
        });
    }

    linkAuthoredPublication(doi: string, authorId: ResearcherIdentifier) {
        this.changes.push({
            id: String(this.version),
            type: 'RESEARCHER_PUBLICATION_LINKED',
            aggregateId: this.id,
            payload: {},
            metadata: {
                timestamp: new Date(),
                sequence: this.version,
            },
        });
    }
}

export class ResearcherProjection implements Projection {
    private researchers = new Map<string, Researcher>();

    apply(event: TheEvent): void {
        if (event.type === 'RESEARCHER_CREATED') {
            const { name, identifier } = (event as TheEvent<'RESEARCHER_CREATED'>).payload;
            const researcher: Researcher = {
                name,
                idGithub: [],
                idSemScholar: [],
                idOrc: [],
                refPublicationDoi: [],
                metaImageUrl: [],
                metaWebsite: [],
            };
            researcher[identifier.type].push(identifier.id);
            this.researchers.set(event.aggregateId, researcher);
        }
        if (event.type === 'RESEARCHER_DETAIL_ADDED') {
            const researcher = this.researchers.get(event.aggregateId);
            if (researcher) {
                const { fresh } = (event as TheEvent<'RESEARCHER_DETAIL_ADDED'>).payload;
                researcher[fresh.type].push(newId.id);
            }
        }
    }

    getState(): Map<string, Researcher> {
        return new Map(this.researchers);
    }
}
