import { profileSchema } from '../../../../packages/schema/mod.ts';
import { defineCollection } from 'astro:content';

const fellowsCollection = defineCollection({
    type: 'content',
    schema: profileSchema,
});

export const collections = {
    fellows: fellowsCollection,
};
