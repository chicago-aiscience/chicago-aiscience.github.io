import { z } from 'astro:content';

export const fellowSchema = z.object({
    name: z.string(),
    cohort: z.enum(['1', '2', '3']),
    githubUser: z.array(z.string()).optional(),
    imageUrl: z.array(z.string()).optional(),
}).passthrough();

export type Fellow = z.infer<typeof fellowSchema>;
