import type {
    Detail,
    Identifier,
    Profile,
    Publication,
    RequiredArrays,
    Researcher,
} from '../../packages/schema/mod.ts';

// aggregates

export interface AggregateDetails<M, P extends keyof M> {
    Model: M;
    Builder: RequiredArrays<M>;
    Identifiers: Identifier<M, P>;
    IdentifierFields: P[];
}

export interface AggregateConfig {
    'RESEARCHER': AggregateDetails<Researcher, 'idGithub' | 'idSemScholar' | 'idOrc'>;
    'PROFILE': AggregateDetails<Profile, 'cohort'>;
    'PUBLICATION': AggregateDetails<Publication, 'idDoi'>;
}

// events

type CreateEvent<T extends keyof AggregateConfig> = {
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
    RESEARCHER_CREATED: CreateEvent<'RESEARCHER'>;
    RESEARCHER_DETAIL_ADDED: AddDetailEvent<'RESEARCHER'>;
    RESEARCHER_IDENTIFIER_MERGED: MergeAggregatesEvent<'RESEARCHER'>;

    // profile
    PROFILE_CREATED: CreateEvent<'PROFILE'>;
    PROFILE_DETAIL_ADDED: AddDetailEvent<'PROFILE'>;
    PROFILE_IDENTIFIER_MERGED: MergeAggregatesEvent<'PROFILE'>;

    // publication
    PUBLICATION_CREATED: CreateEvent<'PUBLICATION'>;
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

export type ResearcherEvent =
    | TheEvent<'RESEARCHER_CREATED'>
    | TheEvent<'RESEARCHER_DETAIL_ADDED'>
    | TheEvent<'RESEARCHER_IDENTIFIER_MERGED'>
    | TheEvent<'RESEARCHER_PUBLICATION_LINKED'>;
export type ProfileEvent =
    | TheEvent<'PROFILE_CREATED'>
    | TheEvent<'PROFILE_DETAIL_ADDED'>
    | TheEvent<'PROFILE_IDENTIFIER_MERGED'>;
export type PublicationEvent =
    | TheEvent<'PUBLICATION_CREATED'>
    | TheEvent<'PUBLICATION_DETAIL_ADDED'>
    | TheEvent<'PUBLICATION_IDENTIFIER_MERGED'>
    | TheEvent<'RESEARCHER_PUBLICATION_LINKED'>;

export const RESEARCHER_EVENT_TYPES = [
    'RESEARCHER_CREATED',
    'RESEARCHER_DETAIL_ADDED',
    'RESEARCHER_IDENTIFIER_MERGED',
    'RESEARCHER_PUBLICATION_LINKED',
] as const satisfies readonly EventType[];

export function filterEvents<T extends readonly EventType[]>(
    events: TheEvent[],
    allowedTypes: T,
): events is TheEvent<T[number]>[] {
    return events.every((event) => allowedTypes.includes(event.type));
}

export function filterResearcherEvents(events: TheEvent[]): ResearcherEvent[] {
    return events.filter(
        (event): event is ResearcherEvent =>
            RESEARCHER_EVENT_TYPES.includes(event.type as typeof RESEARCHER_EVENT_TYPES[number]),
    );
}

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
