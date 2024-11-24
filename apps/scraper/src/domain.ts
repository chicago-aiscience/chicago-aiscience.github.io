import type {
    Detail,
    Identifier,
    Profile,
    Publication,
    RequiredArrays,
    Researcher,
} from '../../../packages/schema/mod.ts';

// aggregates

export interface AggregateDetails<M, P extends keyof M> {
    Model: M;
    Builder: RequiredArrays<M>;
    Identifiers: Identifier<M, P>;
    IdentifierFields: P[];
}

export interface AggregateConfig {
    RESEARCHER: AggregateDetails<Researcher, 'idGithub' | 'idSemScholar' | 'idOrc'>;
    PROFILE: AggregateDetails<Profile, 'cohort'>;
    PUBLICATION: AggregateDetails<Publication, 'idDoi'>;
}

// events

type FoundEvent<T extends keyof AggregateConfig> = {
    identifier: AggregateConfig[T]['Identifiers'];
};
type AddDetailEvent<T extends keyof AggregateConfig> = {
    identifier: AggregateConfig[T]['Identifiers'];
    update: Detail<AggregateConfig[T]['Model']>;
};
type LinkEvent<T extends keyof AggregateConfig, U extends keyof AggregateConfig> = {
    source: AggregateConfig[T]['Identifiers'];
    target: AggregateConfig[U]['Identifiers'];
};
type MergeAggregatesEvent<T extends keyof AggregateConfig> = {
    sourceId: string;
    targetId: string;
    mergedIdentifiers: AggregateConfig[T]['Identifiers'][];
};

export interface EventPayload {
    // researcher
    RESEARCHER_FOUND: FoundEvent<'RESEARCHER'>;
    RESEARCHER_DETAIL_ADDED: AddDetailEvent<'RESEARCHER'>;
    RESEARCHER_IDENTIFIER_MERGED: MergeAggregatesEvent<'RESEARCHER'>;

    // profile
    PROFILE_CREATED: FoundEvent<'PROFILE'>;
    PROFILE_DETAIL_ADDED: AddDetailEvent<'PROFILE'>;
    PROFILE_IDENTIFIER_MERGED: MergeAggregatesEvent<'PROFILE'>;

    // publication
    PUBLICATION_CREATED: FoundEvent<'PUBLICATION'>;
    PUBLICATION_DETAIL_ADDED: AddDetailEvent<'PUBLICATION'>;
    PUBLICATION_IDENTIFIER_MERGED: MergeAggregatesEvent<'PUBLICATION'>;

    // linkages
    RESEARCHER_PUBLICATION_LINKED: LinkEvent<'RESEARCHER', 'PUBLICATION'>;
}

export type EventType = keyof EventPayload;

interface EventMetadata {
    timestamp: Date;
    sequence: number;
}
interface EventBase {
    id: string;
    aggregateId: string;
    metadata: EventMetadata;
}
export type TheEvent<T extends EventType = EventType> = EventBase & {
    type: T;
    payload: EventPayload[T];
};

export const RESEARCHER_EVENT_TYPES = [
    'RESEARCHER_FOUND',
    'RESEARCHER_DETAIL_ADDED',
    'RESEARCHER_IDENTIFIER_MERGED',
    'RESEARCHER_PUBLICATION_LINKED',
] as const satisfies readonly EventType[];

export const PROFILE_EVENT_TYPES = [
    'PROFILE_CREATED',
    'PROFILE_DETAIL_ADDED',
    'PROFILE_IDENTIFIER_MERGED',
] as const satisfies ReadonlyArray<EventType>;

export const PUBLICATION_EVENT_TYPES = [
    'PUBLICATION_CREATED',
    'PUBLICATION_DETAIL_ADDED',
    'PUBLICATION_IDENTIFIER_MERGED',
    'RESEARCHER_PUBLICATION_LINKED',
] as const satisfies ReadonlyArray<EventType>;

export const AGGREGATE_EVENT_TYPES = {
    RESEARCHER: RESEARCHER_EVENT_TYPES,
    PROFILE: PROFILE_EVENT_TYPES,
    PUBLICATION: PUBLICATION_EVENT_TYPES,
} as const satisfies Record<keyof AggregateConfig, readonly EventType[]>;

type UnionFromTuple<T extends readonly string[]> = T[number];
type EventUnion<T extends readonly EventType[]> = {
    [K in UnionFromTuple<T>]: TheEvent<K>;
}[UnionFromTuple<T>];

export type ResearcherEvent = EventUnion<typeof AGGREGATE_EVENT_TYPES['RESEARCHER']>;
export type ProfileEvent = EventUnion<typeof AGGREGATE_EVENT_TYPES['PROFILE']>;
export type PublicationEvent = EventUnion<typeof AGGREGATE_EVENT_TYPES['PUBLICATION']>;

type EventsByAggregate = {
    [K in keyof typeof AGGREGATE_EVENT_TYPES]: {
        type: (typeof AGGREGATE_EVENT_TYPES)[K];
        events: TheEvent[];
    };
};

export function splitEvents(events: TheEvent[]): EventsByAggregate {
    return {
        RESEARCHER: {
            type: AGGREGATE_EVENT_TYPES.RESEARCHER,
            events: events.filter((e) =>
                AGGREGATE_EVENT_TYPES.RESEARCHER.includes(
                    e.type as typeof AGGREGATE_EVENT_TYPES.RESEARCHER[number],
                )
            ),
        },
        PROFILE: {
            type: AGGREGATE_EVENT_TYPES.PROFILE,
            events: events.filter((e) =>
                AGGREGATE_EVENT_TYPES.PROFILE.includes(
                    e.type as typeof AGGREGATE_EVENT_TYPES.PROFILE[number],
                )
            ),
        },
        PUBLICATION: {
            type: AGGREGATE_EVENT_TYPES.PUBLICATION,
            events: events.filter((e) =>
                AGGREGATE_EVENT_TYPES.PUBLICATION.includes(
                    e.type as typeof AGGREGATE_EVENT_TYPES.PUBLICATION[number],
                )
            ),
        },
    };
}

export function filterResearcherEvents(events: TheEvent[]): ResearcherEvent[] {
    return events.filter(
        (event): event is ResearcherEvent =>
            // TODO: Typescript is funnily tricky about contravariance it seems like compared to say Python... couldn't get away without a type assertion to wire this together
            RESEARCHER_EVENT_TYPES.includes(event.type as typeof RESEARCHER_EVENT_TYPES[number]),
    );
}

// commands

export default interface Commands {
    INGEST_CONFIG: {
        path: string;
    };
}

export type CommandType = keyof Commands;

export type TheCommand<T extends CommandType = CommandType> = EventBase & {
    type: T;
    payload: Commands[T];
};
