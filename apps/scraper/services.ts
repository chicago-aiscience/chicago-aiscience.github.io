import {
    type Detail,
    type Fellow,
    FellowSchema,
    type Researcher,
} from '../../packages/schema/mod.ts';
import { CreateResearcherHandler } from './handlers.ts';
import type { ConfigLoader, ConfigParser, EventBus, EventStore } from './infrasructure.ts';
import { ResearcherAggregate, ResearcherProjection } from './researcher.ts';
import type { TheCommand, TheEvent } from './domain.ts';

export interface ResearcherIngestionService {
    ingestConfig(path: string): Promise<Researcher[]>;
}

export class ResearcherService implements ResearcherIngestionService {
    private createResearcherHandler;

    constructor(
        private eventStore: EventStore,
        private eventBus: EventBus,
        private parser: ConfigParser,
        private loader: ConfigLoader,
    ) {
        this.createResearcherHandler = new CreateResearcherHandler(eventStore);
    }

    async ingestConfig(path: string): Promise<Fellow[]> {
        const configData = await this.loader.loadConfig(path);
        const fellows = FellowSchema.array().parse(configData);
        const commands = fellows.map((fellow) =>
            this.createCommand(fellow, { type: 'cohort', id: fellow.idCohort })
        );
        commands.forEach((command) => this.createResearcherHandler.handle(command));

        const events: TheEvent[] = [];
        for (const fellow of fellows) {
            const id = this.generateId(fellow.name, fellow.idCohort);
            const builder = new ResearcherAggregate(id);
            builder.create(fellow.name, { type: 'cohort', id: fellow.idCohort });
            events.push(...builder.commit());
        }

        await this.eventStore.append(events);
        await Promise.all(events.map((e) => this.eventBus.publish(e)));

        const projection = new ResearcherProjection();
        events.forEach((e) => projection.apply(e));
        return [...projection.getState().values()];
    }

    private createCommand<R extends Researcher>(
        researcher: R,
        identifier: Detail<R>,
    ): TheCommand<'CREATE_RESEARCHER'> {
        const aggregateId = this.generateId(researcher.name, String(identifier.id));
        return {
            type: 'CREATE_RESEARCHER',
            aggregateId,
            id: aggregateId,
            payload: {
                name: researcher.name,
                identifier: identifier,
            },
        };
    }

    private generateId(name: string, cohort: string): string {
        return `${cohort}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    }
}
