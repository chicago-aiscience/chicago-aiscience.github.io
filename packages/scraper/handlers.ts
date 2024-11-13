import type { EventStore } from './infrasructure.ts';
import { ResearcherAggregate } from './researcher.ts';
import type { CommandType, TheCommand } from './types.ts';

export interface CommandHandler<T extends CommandType> {
    handle(command: TheCommand<T>): Promise<void>;
}

export class CreateResearcherHandler implements CommandHandler<'CREATE_RESEARCHER'> {
    constructor(private eventStore: EventStore) {}

    async handle(command: TheCommand<'CREATE_RESEARCHER'>): Promise<void> {
        const aggregate = new ResearcherAggregate(command.aggregateId);
        const storeEvents = await this.eventStore.getByAggregateId(
            command.aggregateId,
        );
        aggregate.load(storeEvents);
        aggregate.create(command.payload.name, command.payload.cohort);
        const changes = aggregate.commit();
        this.eventStore.append(changes);
    }
}
