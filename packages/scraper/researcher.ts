import type { TheEvent } from './types.ts';

export interface Projection {
    apply(event: TheEvent): void;
    getState(): Map<string, ResearcherState>;
}

export interface RawResearcher {
    name: string;
    cohort: string;
    githubUser?: string[] | undefined;
    imageUrl?: string[] | undefined;
}

export interface ResearcherState {
    name: string;
    cohort: string;
    githubUsers: string[];
    imageUrls: string[];
}

export class ResearcherAggregate {
    private state: Partial<ResearcherState> = {
        githubUsers: [],
        imageUrls: [],
    };
    private changes: TheEvent[] = [];
    private version = 0;

    constructor(private id: string) {}

    apply(event: TheEvent): void {
        switch (event.type) {
            case 'RESEARCHER_CREATED': {
                const { name, cohort, githubUser, imageUrl } = event.payload;
                this.state = {
                    name,
                    cohort,
                    githubUsers: githubUser ?? [],
                    imageUrls: imageUrl ?? [],
                };
                break;
            }
        }
        this.version++;
    }

    create(name: string, cohort: string): void {
        if (this.state.name) throw new Error('Already exists');

        this.changes.push({
            id: String(this.version),
            type: 'RESEARCHER_CREATED',
            aggregateId: this.id,
            payload: { name, cohort },
            metadata: {
                timestamp: new Date(),
                sequence: this.version,
            },
        });
    }

    commit(): TheEvent[] {
        const events = [...this.changes];
        this.changes = [];
        return events;
    }

    load(events: TheEvent[]): void {
        events.forEach((event) => this.apply(event));
        this.version = events.length;
    }
}

export class ResearcherProjection implements Projection {
    private researchers = new Map<string, ResearcherState>();

    apply(event: TheEvent): void {
        if (event.type === 'RESEARCHER_CREATED') {
            const { name, cohort, githubUser, imageUrl } = event.payload;
            this.researchers.set(event.aggregateId, {
                name,
                cohort,
                githubUsers: githubUser ?? [],
                imageUrls: imageUrl ?? [],
            });
        }
    }

    getState(): Map<string, ResearcherState> {
        return new Map(this.researchers);
    }
}
