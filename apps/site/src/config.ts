import type { Pages, SiteConfig } from './types.ts';

export const SITE_NAME = 'AI Science';

export const pages = {
    fellows: {
        title: 'Fellows',
        path: '/fellows',
        description: 'current and former Schmidt Fellows',
    },
    research: {
        title: 'Research',
        path: '/research',
        description: 'published papers',
    },
    software: {
        title: 'Software',
        path: '/software',
        description: 'public software',
    },
    about: {
        title: 'About',
        path: '/about',
        description: 'about the program',
    },
} satisfies Pages;

export const siteConfig = {
    title: 'Eric and Wendy Schmidt AI in Science Postdoctoral Fellowship',
    path: '/',
    brand: 'AI Science',
    description: 'Fellow’s Research',
    navItems: [
        'fellows',
        'research',
        'software',
        'about',
    ],
} satisfies SiteConfig<typeof pages>;
