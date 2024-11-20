import type { z } from 'zod';

export type ZodListType<T extends z.ZodType> = T extends z.ZodArray<infer U> ? T
    : z.ZodArray<T>;

type StrictElementType<T> = T extends (infer E)[] ? Required<E> : Required<T>;
// type ExtractZodType<T> = T extends z.ZodType<infer U> ? U : never;
type ToZodArrayWithDefault<T> = z.ZodDefault<
    z.ZodArray<z.ZodType<StrictElementType<T>, z.ZodTypeDef, StrictElementType<T>>, 'many'>
>;

export type RequiredArrays<T> = {
    [P in keyof Required<T>]: Required<T>[P] extends Array<infer _>
        ? Required<T>[P]
        : Array<Required<T>[P]>
}

// export type BuilderSchema<T extends z.ZodObject<z.ZodRawShape>> = z.ZodObject<{
//     [K in keyof T['shape']]: T['shape'][K] extends z.ZodOptional<z.ZodArray<infer U>>
//         ? z.ZodArray<U>
//         : T['shape'][K] extends z.ZodOptional<infer V>
//             ? z.ZodArray<V>
//             : T['shape'][K] extends z.ZodArray<infer _>
//                 ? T['shape'][K]
//                 : z.ZodArray<T['shape'][K]>
// }>

type test1 = Required<{ a?: string | undefined, b: number, c: string[], d?: string[] | undefined }>

type test2 = RequiredArrays<{ a?: string | undefined, b: number, c: string[], d?: string[] | undefined }>
