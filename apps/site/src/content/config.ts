import { FellowSchema } from '../../../../packages/schema/mod.ts';
import { defineCollection } from 'astro:content';

const fellowsCollection = defineCollection({
    type: 'content',
    schema: FellowSchema,
});

export const collections = {
    fellows: fellowsCollection,
};
