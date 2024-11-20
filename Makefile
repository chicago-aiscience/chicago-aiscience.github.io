
lint:
	deno fmt
	deno lint

clean:
	rm -rf packages/site/.astro/

distclean:
	rm -rf node_modules/

	rm -rf packages/site/.astro/
	rm -rf packages/site/node_modules/
	rm -rf dist/

install: site-install scraper-install

check: site-check scraper-check types-check

.PHONY: install run check clean distclean


# site

site-install:
	deno install -c apps/site/deno.json
	deno task -c apps/site/deno.json build

site-run:
	deno task -c apps/site/deno.json start

site-check:
	deno task -c apps/site/deno.json test


# scraper

scraper-install:
	deno cache apps/scraper/main.ts

scraper-run:
	deno task -c apps/scraper/deno.json start

scraper-check:
	deno task -c apps/scraper/deno.json test


# types

schema-check:
	deno task -c packages/schema/deno.json test
