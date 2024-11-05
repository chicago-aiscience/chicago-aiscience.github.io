
**Status: Early Release**

- Initial release was developed on an extremely urgent and truncated timeline
- Core systems demonstrate intended patterns but are incomplete
- Much functionality is stubbed or partially implemented
- Documentation is limited
- Development continues. Expect changes to all components.

---


# AI in Science

Operated by the [University of Chicago Schmidt AI in Science postdocs](https://aiscience.uchicago.edu/fellows/) to document research and pool computational strategy.
Supported by [engineer Chris Redmond](https://datascience.uchicago.edu/people/chris-redmond/).


## Project structure

The core of the site is a very lightly styled Furo themed Sphinx page.
There are 3 components apart from / related to the Sphinx project itself used to operate the site.

- A Sphinx plugin (found at `./python/research/`)
- A web component wrapping a React-based view (found at `./typescript/research-browser/`)
- A WIP orchestrator service (coming soon) (found at `./typescript/messyscrape/`) based on an append only log system which will ultimately replace ad hoc data collection, track data lineage, and manage data quality

The Sphinx plugin injects instances of the web componenent into the static page.
The intent is to develop more graceful hooks back into the Sphinx domain system, but this falls well out of ths scope of the initial release.

Currently the web component acts as a reader and viewer for JSONL files fetched from `_static/data/`.
Somewhat unconventional, integral to the implementation is ability to be simply injected into statically generated pages with display properties, from styling all they way down to actual content, configurable with simple inline metadata.
JSONL is used for convenience and personal affinity, but serialization logic is isolated and should be easily extensible.
[Messagepack](https://github.com/msgpack/msgpack) and [Websockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) are targets of particular interest.

TODO: Essential filtering logic is being reworked -- initial implementation hack was exceedingly temporary and could not be made public.

A large portion of page content is collected via public API (esp. Octokit and arXiv), formatted as JSONL, and loaded as small to moderate size static assets.
Information for display is collected and downlaoded as JSONL files.

A point of debate is that JSONL content that could in theory be pulled / generated at deploy time is being comitted to the repo.
Issues around running multiple API calls within GitHub actions as well as likely eventual problems with free tier action time limits and bandwidth motivated this choice.
It is under evaluation.
Furthermore, while there may be some cases where site content changes so drastically from one deployment to the next that keeping a record of it is only a burden, in our case and in many others it in fact provides an opportunity to version and manage data quality over time.
Perhaps there is a middle ground where "core" generating data can be comitted to the repo, additonal less critical sources could be used to augment it.
In any case, as long as data is being comitted, some additional work will be required around the orchestrator to guarantee deterministic ordering and the like.
Again this falls well beyond initial scope.


## Building the site

I wish you luck at this stage.
PRs are welcome for build process improvements.

Sphinx relies on the Python "research" extension found here in the repo.
The research extension in turn relies on the static bundle the typescript "research-browser" package builds.

Run `make distclean` to clear current build artifacts.
Run `make browse-build` to bundle the typescript dependency.
Copy the new bundle from the `./dist/` directory into `./python/research/src/research/assets/scripts`.
Note that changing the version number in the Deno emit `bundle.ts` script will change the name of the artifact it produces.
This will in turn require updating the Sphinx setup (found in in `__init__.py`).
If you want to update the `researchers.jsonl` or `papers.jsonl` files, do so now.
Sphinx can be "sticky" when it comes to requirements, so it is easiest to clear your build cache manually when making a change.
For uv, run `uv cache clean research`.
Finally, run `make docs`.
The final site produced can be found under `./docs/_build/`.

Run `make open` to open `index.html` in your default browser.
Given the changing static assets it may be easier to serve the site with `python3 -m http.server --directory docs/_build/ 8000` for instance.

The build will likely be scripted in Python or Typescript, but details have not been worked out or explored.
Perhaps a better alternative is vendoring individual components through public package repositories, but again research is needed.


## Notable issues

- [ ] Build process needs reworked
    - Notably we currenlty commit a prebundled version of frontend assets copied into `./python/research/assets/`
- [ ] Developer documentation is missing but in progress
- [ ] Missing contributing guidelines
- [ ] Missing release instructions
