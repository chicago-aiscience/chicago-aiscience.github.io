import type { AggregateConfig, ResearcherEvent, TheEvent } from './domain.ts';
import type { Detail, Researcher, ResearcherBuilder } from '../../packages/schema/mod.ts';

export interface Projection {
    apply(event: TheEvent): void;
    getState(): Map<string, ResearcherBuilder>;
}

export class ResearcherAggregate {
    private state: ResearcherBuilder = {
        idGithub: [],
        idSemScholar: [],
        idOrc: [],
        metaName: [],
        metaImageUrl: [],
        metaWebsite: [],
        refPublicationDoi: [],
    };
    private changes: ResearcherEvent[] = [];
    private version = 0;
    private identifierFields: AggregateConfig['RESEARCHER']['Identifiers']['type'][] = [
        'idGithub',
        'idSemScholar',
        'idOrc',
    ];

    constructor(
        private id: string,
        identifiers: AggregateConfig['RESEARCHER']['Identifiers'][],
    ) {
        this.initIdentifiers(identifiers);
    }

    private initIdentifiers(identifiers: AggregateConfig['RESEARCHER']['Identifiers'][]): void {
        for (const id of identifiers) {
            this.updateState(id);
        }
    }

    apply(event: ResearcherEvent): void {
        switch (event.type) {
            case 'RESEARCHER_CREATED':
                this.updateState(event.payload.identifier);
                break;
            case 'RESEARCHER_DETAIL_ADDED':
                this.updateState(event.payload.update);
                break;
            case 'RESEARCHER_PUBLICATION_LINKED':
                this.state.refPublicationDoi.push(event.payload.target.value);
                break;
            case 'RESEARCHER_IDENTIFIER_MERGED':
                for (const identifier of event.payload.mergedIdentifiers) {
                    this.updateState(identifier);
                }
        }
        this.changes.push(event);
        this.version++;
    }

    updateState({ type, value }: Detail<Researcher>): void {
        if (!Array.isArray(value)) {
            this.state[type].push(value);
            return;
        }
        this.state[type] = [...this.state[type], ...value];
    }

    load(events: ResearcherEvent[]): void {
        events.forEach((event) => this.apply(event));
        this.version = events.length;
    }

    commit(): ResearcherEvent[] {
        const events = [...this.changes];
        this.changes = [];
        return events;
    }

    getIdentifier(): AggregateConfig['RESEARCHER']['Identifiers'] {
        const identifiers = this.knownIdentifiers();
        if (!identifiers) throw new Error('No identifiers present');
        return identifiers[0];
    }

    knownIdentifiers(): AggregateConfig['RESEARCHER']['Identifiers'][] {
        const identifiers: AggregateConfig['RESEARCHER']['Identifiers'][] = [];
        for (const type of this.identifierFields) {
            for (const value of this.state[type]) {
                identifiers.push({ type, value });
            }
        }
        return identifiers;
    }

    create(identifier: AggregateConfig['RESEARCHER']['Identifiers']): void {
        this.changes.push({
            id: String(this.version),
            type: 'RESEARCHER_CREATED',
            aggregateId: this.id,
            payload: { identifier },
            metadata: {
                timestamp: new Date(),
                sequence: this.version,
            },
        });
    }

    addDetail(update: Detail<Researcher>): void {
        this.changes.push({
            id: String(this.version),
            type: 'RESEARCHER_DETAIL_ADDED',
            aggregateId: this.id,
            payload: {
                identifier: this.getIdentifier(),
                update,
            },
            metadata: {
                timestamp: new Date(),
                sequence: this.version,
            },
        });
    }

    linkPublication(publicationDoi: string): void {
        this.changes.push({
            id: String(this.version),
            type: 'RESEARCHER_PUBLICATION_LINKED',
            aggregateId: this.id,
            payload: {
                source: this.getIdentifier(),
                target: {
                    type: 'idDoi',
                    value: publicationDoi,
                },
            },
            metadata: {
                timestamp: new Date(),
                sequence: this.version,
            },
        });
    }
}

export class ResearcherProjection implements Projection {
    private researchers = new Map<string, ResearcherBuilder>();

    apply(event: ResearcherEvent): void {
        if (event.type === 'RESEARCHER_CREATED') {
            const { identifier } = event.payload;
            const researcher = {
                idGithub: [],
                idSemScholar: [],
                idOrc: [],
                metaName: [],
                metaImageUrl: [],
                metaWebsite: [],
                refPublicationDoi: [],
            };
            this.updateResearcherField(researcher, identifier);
            this.researchers.set(event.aggregateId, researcher);
        } else if (event.type === 'RESEARCHER_DETAIL_ADDED') {
            const researcher = this.researchers.get(event.aggregateId);
            if (researcher) {
                const { update } = event.payload;
                this.updateResearcherField(researcher, update);
            }
        } else if (event.type === 'RESEARCHER_IDENTIFIER_MERGED') {
            const target = this.researchers.get(event.payload.targetId);
            if (target) {
                for (const identifier of event.payload.mergedIdentifiers) {
                    this.updateResearcherField(target, identifier);
                }
            }
        }
    }

    private updateResearcherField<K extends keyof ResearcherBuilder>(
        researcher: ResearcherBuilder,
        { type, value }: Detail<Researcher>,
    ): void {
        if (Array.isArray(value)) {
            researcher[type] = [...researcher[type], ...value];
            return;
        }
        researcher[type] = [...researcher[type], value];
    }

    getState(): Map<string, ResearcherBuilder> {
        return new Map(this.researchers);
    }
}
