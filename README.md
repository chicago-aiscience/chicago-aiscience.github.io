# AI in Science

## Resources

- https://github.com/actions/upload-pages-artifact
  - Using this action template for pages upload
  - Also using poorly understood concurrency option in the pages action to block automatic action
    from running

- https://docs.astro.build/en/reference/errors/missing-sharp/
  - main takeaway after fighting with this: DO NOT allow scripts to run during installation
  - Currently just not allowing with Deno during installation (not passing `--allow-scripts`)
  - TODO: actually fix -- shouldn't have sharp script run during install

- core docs:
  - Astro framework: https://docs.astro.build/en/getting-started/
  - MDN CSS: https://developer.mozilla.org/en-US/docs/Web/CSS
  - Tailwind: https://tailwindcss.com/docs/display

- sink:

## Notes

- In case of syntax highlighting issues, ensure `"types": ["astro/client"]` is in `tsconfig.json`
  and then run `<cmd> + <shift> + p` + `Developer: Reload Window`
  - usually need after `make distclean`
- (2024/11/11) Did route type wrong the first time, far too rigid. Implementing fix, not sure if
  it's right yet.
  - Definitely some annoyances around configuring the "page config" and "site config". Distinction
    maybe isn't clear, will need to work to document it sufficiently, but it gets the page up, and I
    trust that links are validated. (Page config configures sidebar and internal routes in ever
    page, site config holds this info for base page + used as defaults for missing on other pages.)
    Must export full
