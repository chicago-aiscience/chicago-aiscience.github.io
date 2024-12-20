import type { Pages, SiteConfig } from "./types";

export const pages = {
  fellows: {
    title: "Fellows",
    path: "/fellows",
    description: "current and former Schmidt Fellows",
  },
  research: {
    title: "Research",
    path: "/research",
    description: "published papers",
  },
  software: {
    title: "Software",
    path: "/software",
    description: "public software",
  },
  about: {
    title: "About",
    path: "/about",
    description: "about the program",
  },
} satisfies Pages;

export const siteConfig = {
  title: "AI in Science",
  path: "/",
  brand: "AI Science",
  description: "Postdocs research",
  navItems: [
    "fellows",
    "research",
    "software",
    "about",
  ],
} satisfies SiteConfig<typeof pages>;
