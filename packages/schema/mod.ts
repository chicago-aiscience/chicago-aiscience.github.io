import { z } from 'zod';

export type GithubId = string;
export type SemScholarId = string;
export type OrcId = string;

export const ResearcherSchema = z.object({
    name: z.string(),

    // identifying
    idGithub: z.array(z.string().transform((val) => val as GithubId)).default([]),
    idSemScholar: z.array(z.string().transform((val) => val as SemScholarId)).default([]),
    idOrc: z.array(z.string().transform((val) => val as OrcId)).default([]),

    // metadata
    metaImageUrl: z.array(z.string()).default([]),
    metaWebsite: z.array(z.string()).default([]),

    // references
    refPublicationDoi: z.array(z.string()).default([]),
});

export const FellowSchema = ResearcherSchema.extend({
    activeFellow: z.boolean().default(true),

    // id
    idCohort: z.string(),
});

export const PublicationSchema = z.object({
    title: z.string(),
    year: z.string().optional(),

    // id
    idDoi: z.string(),

    // metadata
    metaVenue: z.array(z.string()).default([]),

    // refrence
    refAuthors: z.array(z.string()).default([]),
});

export type Researcher = z.infer<typeof ResearcherSchema>;
export type Fellow = z.infer<typeof FellowSchema>;
export type Publication = z.infer<typeof PublicationSchema>;

// little bit of gymnsatics to guarantee the types agree
// if the type is an array, require a single element otherwise require the type
export type Detail<T, K extends keyof T = keyof T> = {
    [P in K]: {
        type: P;
        id: T[P] extends (infer U)[] ? U : T[P];
    };
}[K];
