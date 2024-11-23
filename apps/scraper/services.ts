import { type Profile, profileSchema, type ResearcherBuilder } from '../../packages/schema/mod.ts';
import { type AggregateConfig, filterResearcherEvents } from './domain.ts';
// import { CreateResearcherHandler } from './handlers.ts';
import type { ConfigLoader, ConfigParser, EventBus, EventStore } from './infrasructure.ts';
import { ResearcherProjection } from './researcher.ts';
import { ResearcherAggregate } from './researcher.ts';

export interface ResearcherIngestionService {
    ingestProfiles(path: string): Promise<ResearcherBuilder[]>;
}

export class ResearcherService implements ResearcherIngestionService {
    // private createResearcherHandler;

    constructor(
        private eventStore: EventStore,
        private eventBus: EventBus,
        private parser: ConfigParser,
        private loader: ConfigLoader,
    ) {
        // this.createResearcherHandler = new CreateResearcherHandler(eventStore);
    }

    private resolveExistingId(
        profile: Profile,
        projection: ResearcherProjection,
    ): string | undefined {
        const identifierFields = ['idGithub', 'idSemScholar', 'idOrc'] as const;
        for (const field of identifierFields) {
            const identifierValues = profile[field];
            if (!identifierValues) continue;

            const values = Array.isArray(identifierValues) ? identifierValues : [identifierValues];

            for (const [id, researcher] of projection.getState().entries()) {
                if (researcher[field].some((existingId) => values.includes(existingId))) return id;
            }
        }
        return;
    }

    private async rehydrateAggregate(
        id: string,
        initialIdentifiers: AggregateConfig['RESEARCHER']['Identifiers'][] = [],
    ): Promise<ResearcherAggregate> {
        const events = await this.eventStore.getByAggregateId(id);
        const aggregate = new ResearcherAggregate(id, initialIdentifiers);
        aggregate.load(filterResearcherEvents(events));
        return aggregate;
    }

    async ingestProfiles(path: string, isSchmidtFellowsConfig = false): Promise<ResearcherBuilder[]> {
        const data = await this.loader.loadConfig(path);
        const json = this.parser.parse(data);
        if (!Array.isArray(json)) throw new Error('Config is not an array')

        const profiles = profileSchema.array().parse(json.map(
            p => ({ ...p, isSchmidtFellow: isSchmidtFellowsConfig })
        ));
        const projection = new ResearcherProjection();

        for (const profile of profiles) {
            const identifiers: AggregateConfig['RESEARCHER']['Identifiers'][] = [];

            if (profile.idGithub?.length) {
                identifiers.push(...profile.idGithub.map((id) => ({
                    type: 'idGithub' as const,
                    value: id,
                })));
            }

            if (profile.idSemScholar?.length) {
                identifiers.push(...profile.idSemScholar.map((id) => ({
                    type: 'idSemScholar' as const,
                    value: id,
                })));
            }

            if (profile.idOrc) {
                identifiers.push({
                    type: 'idOrc' as const,
                    value: profile.idOrc,
                });
            }

            if (!identifiers.length) {
                throw new Error(`No valid identifiers found on profile: ${profile.metaName}`);
            }

            const existingId = this.resolveExistingId(profile, projection);
            const aggregateId = existingId ?? this.generateId(profile.metaName, profile.cohort!);

            const aggregate = await this.rehydrateAggregate(aggregateId, []);
            for (const identifier of identifiers) {
                aggregate.create(identifier);
            }

            aggregate.addDetail({ type: 'metaName', value: profile.metaName });

            const events = aggregate.commit();
            await this.eventStore.append(events);
            for (const event of events) {
                projection.apply(event);
                await this.eventBus.publish(event);
            }
        }

        return Array.from(projection.getState().values());
    }

    private generateId(name: string, cohort: string): string {
        return `${cohort}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    }
}
