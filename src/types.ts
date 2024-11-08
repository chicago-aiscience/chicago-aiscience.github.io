import type { routes } from './routes'

export type Route = keyof typeof routes
export type RouteValue = (typeof routes)[Route]

export type NavItem = {
    title: string;
    route: Route;
}

export type SiteConfig = {
    title: string;
    brand: string;
    description: string;
    nav: NavItem[];
}
