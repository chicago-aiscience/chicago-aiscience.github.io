export type PageConfig = {
    title: string;
    path: string;
    description: string;
};

export type Pages = {
    [K: string]: PageConfig;
};

export type SiteConfig<P extends Pages> = NonNullable<PageConfig> & {
    path: '/';
    brand: string;
    navItems: Array<keyof P>;
};

export const HOME = Symbol('home');

export interface ReferenceItem {
    text: string;
    href?: string | undefined;
}
