import { fellowSchema } from '../schemas.ts';
import { defineCollection } from 'astro:content';

const fellowsCollection = defineCollection({
    type: 'content',
    schema: fellowSchema,
});

export const collections = {
    fellows: fellowsCollection,
};
