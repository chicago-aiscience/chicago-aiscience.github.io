export interface EventMetadata {
    timestamp: Date;
    sequence: number;
}

export interface Events {
    RESEARCHER_CREATED: {
        name: string;
        cohort: string;
        githubUser?: string[] | undefined;
        imageUrl?: string[] | undefined;
    };
}

export interface Commands {
    CREATE_RESEARCHER: {
        name: string;
        cohort: string;
    };
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
