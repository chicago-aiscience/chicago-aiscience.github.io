export type RequiredArrays<T> = {
    [P in keyof Required<T>]: Required<T>[P] extends Array<infer _> ? Required<T>[P]
        : Array<Required<T>[P]>;
};

export type Detail<T, K extends keyof T = keyof T> = {
    type: K;
    value: Required<T>[K] extends (infer U)[] ? U : Required<T>[K];
};

export type Identifier<T, K extends keyof T> = Detail<T, K>;
