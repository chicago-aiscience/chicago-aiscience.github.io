import { z } from 'zod';
import type { RequiredArrays } from './utils.ts';

export type _PublicationSchemaType = {
    idDoi: string;
    metaTitle: string;
    metaAbstract?: string;
    metaYear?: number;
    refAuthorId?: string;
};

type _PublicationBuilderSchemaType = RequiredArrays<_PublicationSchemaType>;

export const publicationSchema: z.ZodSchema<_PublicationSchemaType> = z.object({
    idDoi: z.string(),
    metaTitle: z.string(),
    metaAbstract: z.string().optional(),
    metaYear: z.number().optional(),
    refAuthorId: z.string().optional(),
});

export const publicationBuilderSchema: z.ZodSchema<_PublicationBuilderSchemaType> = z.object({
    idDoi: z.array(z.string()),
    metaTitle: z.array(z.string()),
    metaAbstract: z.array(z.string()),
    metaYear: z.array(z.number()),
    refAuthorId: z.array(z.string()),
});

export type Publication = z.infer<typeof publicationSchema>;
export type PublicationBuilder = z.infer<typeof publicationBuilderSchema>;
