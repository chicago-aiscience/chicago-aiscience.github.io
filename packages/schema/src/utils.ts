import { z } from 'zod';

export type RequiredArrays<T> = {
    [P in keyof Required<T>]: Required<T>[P] extends Array<infer _> ? Required<T>[P]
        : Array<Required<T>[P]>;
};

export type OptionalSingleOrArray<T> = {
    [K in keyof T]?: T[K] extends Array<infer U> ? U | U[] : T[K] | T[K][];
};

export type Detail<T, K extends keyof T = keyof T> = {
    type: K;
    value: Required<T>[K] extends (infer U)[] ? U : Required<T>[K];
};

export type Identifier<T, K extends keyof T> = Detail<T, K>;

export const firstOrUndefined = <T>(arr: T[]): T | undefined => arr[0] ?? undefined;

export const zodArrayOrSingle = <T>(schema: z.ZodSchema<T>) =>
    z.union([schema, z.array(schema)])
        .transform((val) => Array.isArray(val) ? val : [val])
        .default([]);
