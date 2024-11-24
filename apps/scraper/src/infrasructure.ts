import type { EventType, TheEvent } from './domain.ts';

export interface EventStore {
    append(events: TheEvent[]): Promise<void>;
    getByAggregateId(id: string): Promise<TheEvent[]>;
}

export interface EventBus {
    publish(event: TheEvent): Promise<void>;
    subscribe<T extends EventType>(
        type: T,
        handler: (event: TheEvent<T>) => Promise<void>,
    ): void;
}

export class InMemoryEventStore implements EventStore {
    private events: TheEvent[] = [];

    append(events: TheEvent[]): Promise<void> {
        this.events.push(...events);
        return Promise.resolve();
    }

    getByAggregateId(id: string): Promise<TheEvent[]> {
        return Promise.resolve(
            this.events.filter((e) => e.aggregateId === id),
        );
    }
}

export class InMemoryEventBus implements EventBus {
    private handlers = new Map<
        EventType,
        Array<(event: TheEvent) => Promise<void>>
    >();

    async publish(event: TheEvent): Promise<void> {
        const handlers = this.handlers.get(event.type) ?? [];
        await Promise.all(handlers.map((h) => h(event)));
    }

    subscribe<T extends EventType>(
        type: T,
        handler: (event: TheEvent<T>) => Promise<void>,
    ): void {
        const handlers = this.handlers.get(type) ?? [];
        handlers.push(handler as (event: TheEvent) => Promise<void>);
        this.handlers.set(type, handlers);
    }
}

export interface ConfigParser {
    parse(data: unknown): unknown;
}

export class JsonConfigParser implements ConfigParser {
    parse(data: unknown): unknown {
        if (typeof data === 'string') {
            return JSON.parse(data);
        }
        return data;
    }
}

export interface ConfigLoader {
    loadConfig(source: string): Promise<unknown>;
}

export class FileConfigLoader implements ConfigLoader {
    async loadConfig(source: string): Promise<string> {
        return await Deno.readTextFile(source);
    }
}

export class StringConfigLoader implements ConfigLoader {
    loadConfig(source: string): Promise<unknown> {
        return Promise.resolve(source);
    }
}
