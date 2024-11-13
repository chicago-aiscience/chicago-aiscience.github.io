import { assertEquals } from '@std/assert';
import type { TheEvent } from './types.ts';
import {
    InMemoryEventBus,
    InMemoryEventStore,
    JsonConfigParser,
    StringConfigLoader,
} from './infrasructure.ts';
import { ResearcherService } from './services.ts';

const sampleConfig = `[
  {
    "name": "Alice Smith",
    "cohort": "2",
    "githubUser": ["alicedev"],
    "imageUrl": ["https://www.example.com/image.jpg"]
  }, {
    "name": "Bob Smith",
    "cohort": "3"
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

    const researchers = await service.ingestConfig(sampleConfig);

    console.log(publishedEvents);
    console.log(researchers);

    assertEquals(researchers.length, 2);
});
