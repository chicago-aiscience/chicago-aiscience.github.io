import { fellowSchema } from '../../../../packages/schema/mod.ts';
import { defineCollection } from 'astro:content';

const fellowsCollection = defineCollection({
    type: 'content',
    schema: fellowSchema,
});

export const collections = {
    fellows: fellowsCollection,
};
