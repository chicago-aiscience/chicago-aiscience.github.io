import type { SiteConfig } from "./types";

export const siteConfig: SiteConfig = {
    title: "AI in Science",
    brand: "AI Science",
    description: "Postdocs research",
    nav: [
        { title: 'Research', route: 'research' },
        { title: 'Fellows', route: 'fellows' },
        { title: 'About', route: 'about' },
    ]
}
