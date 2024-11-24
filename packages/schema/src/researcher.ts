import { z } from 'zod';
import { type OptionalSingleOrArray, type RequiredArrays, zodArrayOrSingle } from './utils.ts';

// final

export type _ResearcherSchemaType = {
    idGithub?: string[] | undefined;
    idSemScholar?: string[] | undefined;
    idOrc?: string | undefined;
    metaName: string;
    metaImageUrl?: string[] | undefined;
    metaWebsite?: string[] | undefined;
    refPublicationDoi?: string[] | undefined;
};

export const researcherSchema: z.ZodSchema<_ResearcherSchemaType> = z.object({
    idGithub: z.array(z.string()).optional(),
    idSemScholar: z.array(z.string()).optional(),
    idOrc: z.string().optional(),
    metaName: z.string(),
    metaImageUrl: z.array(z.string()).optional(),
    metaWebsite: z.array(z.string()).optional(),
    refPublicationDoi: z.array(z.string()).optional(),
});

// builder

type _ResearcherBuilderSchemaType = RequiredArrays<_ResearcherSchemaType>;

export const researcherBuilderSchema: z.ZodSchema<_ResearcherBuilderSchemaType> = z.object({
    idGithub: z.array(z.string()),
    idSemScholar: z.array(z.string()),
    idOrc: z.array(z.string()),
    metaName: z.array(z.string()),
    metaImageUrl: z.array(z.string()),
    metaWebsite: z.array(z.string()),
    refPublicationDoi: z.array(z.string()),
});

// init

type _ResearcherInitSchemaTypeBase = OptionalSingleOrArray<_ResearcherBuilderSchemaType>;

type _ResearcherInitSchemaTypeAliases = {
    name?: string | string[];
    githubUser?: string | string[];
    imageUrl?: string | string[];
    semScholarId?: string | string[];
    orcId?: string | string[];
};

export const researcherInitSchema: z.ZodSchema<
    _ResearcherInitSchemaTypeBase & _ResearcherInitSchemaTypeAliases
> = z.intersection(
    z.object({
        name: zodArrayOrSingle(z.string()),
        githubUser: zodArrayOrSingle(z.string()),
        imageUrl: zodArrayOrSingle(z.string()),
        semScholarId: zodArrayOrSingle(z.string()),
        orcId: zodArrayOrSingle(z.string()),
    }),
    z.object({
        idGithub: zodArrayOrSingle(z.string()),
        idSemScholar: zodArrayOrSingle(z.string()),
        idOrc: zodArrayOrSingle(z.string()),
        metaName: zodArrayOrSingle(z.string()),
        metaImageUrl: zodArrayOrSingle(z.string()),
        metaWebsite: zodArrayOrSingle(z.string()),
        refPublicationDoi: zodArrayOrSingle(z.string()),
    }),
).transform((data) => ({
    idGithub: [...data.idGithub, ...(data.githubUser || [])],
    idSemScholar: [...data.idSemScholar, ...(data.semScholarId || [])],
    idOrc: [...data.idOrc, ...(data.orcId || [])],
    metaName: [...data.metaName, ...(data.name || [])],
    metaImageUrl: [...data.metaImageUrl, ...(data.imageUrl || [])],
    metaWebsite: data.metaWebsite,
    refPublicationDoi: data.refPublicationDoi,
}));

// types

export type Researcher = z.infer<typeof researcherSchema>;
export type ResearcherBuilder = z.infer<typeof researcherBuilderSchema>;
export type ResearcherInit = z.infer<typeof researcherInitSchema>;
