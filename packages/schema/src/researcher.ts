import { z } from 'zod';
import type { RequiredArrays } from './utils.ts';

type _ResearcherSchemaType = {
    idGithub?: string[] | undefined;
    idSemScholar?: string[] | undefined;
    idOrc?: string | undefined;
    metaImageUrl?: string[] | undefined;
    metaWebsite?: string[] | undefined;
    refPublicationDoi?: string[] | undefined;
};
type _ResearcherBuilderSchemaType = RequiredArrays<_ResearcherSchemaType>

export const ResearcherSchema: z.ZodSchema<_ResearcherSchemaType> = z.object({
    idGithub: z.array(z.string()).optional(),
    idSemScholar: z.array(z.string()).optional(),
    idOrc: z.string().optional(),
    metaImageUrl: z.array(z.string()).optional(),
    metaWebsite: z.array(z.string()).optional(),
    refPublicationDoi: z.array(z.string()).optional(),
});

export const ResearcherBuilderSchema: z.ZodSchema<_ResearcherBuilderSchemaType> = z.object({
    idGithub: z.array(z.string()),
    idSemScholar: z.array(z.string()),
    idOrc: z.array(z.string()),
    metaImageUrl: z.array(z.string()),
    metaWebsite: z.array(z.string()),
    refPublicationDoi: z.array(z.string()),
});

export type Researcher = z.infer<typeof ResearcherSchema>;
export type ResearcherBuilder = z.infer<typeof ResearcherBuilderSchema>;
