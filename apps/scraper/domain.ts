import type { Detail, Publication, Researcher } from '../../packages/schema/mod.ts';

export interface EventMetadata {
    timestamp: Date;
    sequence: number;
}

export type ResearcherIdentifier<R extends Researcher = Researcher> = Detail<
    R,
    'idGithub' | 'idSemScholar' | 'idOrc'
>;
export type PublicationIdentifier<P extends Publication = Publication> = Detail<P, 'idDoi'>;

// id - identifying field
type CreateEvent<T, ID extends keyof T = keyof T> = {
    identifier: Detail<T, ID>;
};

// id - identifying field
type AddDetailEvent<T, ID extends keyof T = keyof T> = {
    known: Detail<T, ID>;
    fresh: Detail<T>;
};

// TID - identifier for T, UID - identifier for U
type LinkEvent<T, U, TID extends keyof T = keyof T, UID extends keyof U = keyof U> = {
    source: Detail<T, TID>;
    target: Detail<U, UID>;
};

export interface Events {
    RESEARCHER_CREATED: CreateEvent<Researcher, 'idGithub' | 'idOrc' | 'idSemScholar'> & {
        name: string;
    };
    RESEARCHER_DETAIL_ADDED: AddDetailEvent<Researcher, 'idGithub' | 'idOrc' | 'idSemScholar'>;
    PUBLICATION_CREATED: CreateEvent<Publication, 'idDoi'> & {
        title: string;
    };
    PUBLICATION_DETAIL_ADDED: AddDetailEvent<Publication, 'idDoi'>;
    RESEARCHER_PUBLICATION_LINKED: LinkEvent<
        Researcher,
        Publication,
        'idGithub' | 'idOrc' | 'idSemScholar',
        'idDoi'
    >;
}

type CreateCommand<T, ID extends keyof T = keyof T> = {
    identifier: Detail<T, ID>;
};

type AddDetailCommand<T, ID extends keyof T = keyof T> = {
    known: Detail<T, ID>;
    fresh: Detail<T, keyof T>;
};

type LinkCommand<T, U, TID extends keyof T = keyof T, UID extends keyof U = keyof U> = {
    source: Detail<T, TID>;
    target: Detail<U, UID>;
};

export interface Commands {
    CREATE_RESEARCHER: CreateCommand<Researcher, 'idGithub' | 'idOrc' | 'idSemScholar'> & {
        name: string;
    };
    ADD_RESEARCHER_DETAIL: AddDetailCommand<Researcher, 'idGithub' | 'idOrc' | 'idSemScholar'>;
    CREATE_PUBLICATION: CreateCommand<Publication, 'idDoi'> & {
        title: string;
    };
    ADD_PUBLICATION_DETAIL: AddDetailCommand<Publication, 'idDoi'>;
    LINK_RESEARCHER_PUBLICATION: LinkCommand<Researcher, Publication>;
    INGEST_CONFIG: {
        path: string;
    };
}

export type EventType = keyof Events;
export type CommandType = keyof Commands;

export interface TheEvent<T extends EventType = EventType> {
    id: string;
    type: T;
    aggregateId: string;
    payload: Events[T];
    metadata: EventMetadata;
}

export interface TheCommand<T extends CommandType = CommandType> {
    id: string;
    type: T;
    aggregateId: string;
    payload: Commands[T];
}
