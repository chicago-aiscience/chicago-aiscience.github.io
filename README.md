# AI in Science

## Resources

- https://github.com/actions/upload-pages-artifact
  - Using this action template for pages upload
  - Also using poorly understood concurrency option in the pages action to block
    automatic action from running

- https://docs.astro.build/en/reference/errors/missing-sharp/
  - main takeaway after fighting with this: DO NOT allow scripts to run during
    installation
  - Currently just not allowing with Deno during installation (not passing
    `--allow-scripts`)
  - TODO: actually fix -- shouldn't have sharp script run during install

- core docs:
  - Astro framework: https://docs.astro.build/en/getting-started/
  - MDN CSS: https://developer.mozilla.org/en-US/docs/Web/CSS

## Notes

- In case of syntax highlighting issues, ensure `"types": ["astro/client"]` is
  in `tsconfig.json` and then run `<cmd> + <shift> + p` +
  `Developer: Reload Window`
  - usually need after `make distclean`
- Did route type wrong the first time, far too rigid. Implementing fix, not sure
  if it's right yet.
