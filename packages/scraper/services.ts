import { CreateResearcherHandler } from './handlers.ts';
import type { ConfigLoader, ConfigParser, EventBus, EventStore } from './infrasructure.ts';
import {
    type RawResearcher,
    ResearcherAggregate,
    ResearcherProjection,
    type ResearcherState,
} from './researcher.ts';
import type { TheCommand, TheEvent } from './types.ts';

export interface ResearcherIngestionService {
    ingestConfig(path: string): Promise<ResearcherState[]>;
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

    async ingestConfig(path: string): Promise<ResearcherState[]> {
        const configData = await this.loader.loadConfig(path);
        const researchers = this.parser.parse(configData);
        const commands = researchers.map((r) => this.createCommand(r));
        commands.forEach((command) => this.createResearcherHandler.handle(command));

        const events: TheEvent[] = [];
        for (const r of researchers) {
            const id = this.generateId(r.name, r.cohort);
            const builder = new ResearcherAggregate(id);
            builder.create(r.name, r.cohort);
            events.push(...builder.commit());
        }

        await this.eventStore.append(events);
        await Promise.all(events.map((e) => this.eventBus.publish(e)));

        const projection = new ResearcherProjection();
        events.forEach((e) => projection.apply(e));
        return [...projection.getState().values()];
    }

    private createCommand(
        researcher: RawResearcher,
    ): TheCommand<'CREATE_RESEARCHER'> {
        const aggregateId = this.generateId(researcher.name, researcher.cohort);
        return {
            type: 'CREATE_RESEARCHER',
            aggregateId,
            id: aggregateId,
            payload: {
                name: researcher.name,
                cohort: researcher.cohort,
            },
        };
    }

    private generateId(name: string, cohort: string): string {
        return `${cohort}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    }
}
