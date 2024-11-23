import { assertEquals } from '@std/assert';
import type { TheEvent } from './domain.ts';
import {
    InMemoryEventBus,
    InMemoryEventStore,
    JsonConfigParser,
    StringConfigLoader,
} from './infrasructure.ts';
import { ResearcherService } from './services.ts';

const sampleConfig = `[
  {
    "metaName": "Alice Smith",
    "cohort": "2",
    "idGithub": ["alicedev"],
    "metaImageUrls": ["https://www.example.com/image.jpg"]
  }, {
    "metaName": "Bob Smith",
    "cohort": "3",
    "idOrc": "8675309"
  }
]`;

Deno.test('researcher ingestion', async () => {
    const store = new InMemoryEventStore();
    const bus = new InMemoryEventBus();
    const parser = new JsonConfigParser();
    const loader = new StringConfigLoader();
    const service = new ResearcherService(store, bus, parser, loader);

    const publishedEvents: TheEvent[] = [];
    bus.subscribe('RESEARCHER_CREATED', (event) => {
        publishedEvents.push(event);
        return Promise.resolve();
    });

    const researchers = await service.ingestProfiles(sampleConfig);

    console.log(publishedEvents);
    console.log(researchers);

    assertEquals(researchers.length, 2);
});
