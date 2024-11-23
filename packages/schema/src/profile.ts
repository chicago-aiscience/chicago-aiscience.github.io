import { z } from 'zod';
import {
    type _ResearcherSchemaType,
    researcherBuilderSchema,
    researcherSchema,
} from './researcher.ts';
import type { RequiredArrays } from './utils.ts';

export type _ProfileSchemaType = _ResearcherSchemaType & {
    isSchmidtFellow: boolean;
    cohort?: string | undefined;
};

type _ProfileBuilderSchemaType = RequiredArrays<_ProfileSchemaType>;

export const profileSchema: z.ZodSchema<_ProfileSchemaType> = z.intersection(
    researcherSchema,
    z.object({
        isSchmidtFellow: z.boolean(),
        cohort: z.string().optional(),
    }),
);

export const profileBuilderSchema: z.ZodSchema<_ProfileBuilderSchemaType> = z.intersection(
    researcherBuilderSchema,
    z.object({
        isSchmidtFellow: z.array(z.boolean()),
        cohort: z.array(z.string()),
    }),
);

export type Profile = z.infer<typeof profileSchema>;
export type ProfileBuilder = z.infer<typeof profileBuilderSchema>;

// schmidt fellows

export const schmidtFellowSchema: z.ZodSchema<_ProfileSchemaType> = profileSchema.refine(
    (profile) => profile.isSchmidtFellow && profile.cohort !== undefined,
);
