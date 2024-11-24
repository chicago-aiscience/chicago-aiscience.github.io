
install: site-install scraper-install

run: site-run

lint:
	deno fmt
	deno lint

build: schema-build scraper-build site-build

clean:
	rm -rf packages/site/.astro/

distclean:
	rm -rf node_modules/

	rm -rf packages/site/.astro/
	rm -rf packages/site/node_modules/
	rm -rf coverage/
	rm -rf dist/

check: site-check scraper-check schema-check

.PHONY: install run check clean distclean


# site

site-install:
	deno install -c apps/site/deno.json
	deno task -c apps/site/deno.json build

site-run:
	deno task -c apps/site/deno.json start

site-check:
	deno task -c apps/site/deno.json test

site-build:
	deno task -c apps/site/deno.json build


# scraper

scraper-install:
	deno cache apps/scraper/main.ts

scraper-run:
	deno task -c apps/scraper/deno.json start

scraper-check:
	mkdir -p coverage/scraper/
	rm -rf coverage/scraper/*
	deno task -c apps/scraper/deno.json typecheck
	deno task -c apps/scraper/deno.json test
	deno coverage coverage/scraper/ --lcov --output=coverage/scraper.lcov
	deno coverage coverage/scraper/ --html

scraper-build:
	deno task -c apps/scraper/deno.json build


# types

schema-check:
	mkdir -p coverage/schema/
	rm -rf coverage/schema/*
	deno task -c packages/schema/deno.json typecheck
	deno task -c packages/schema/deno.json test
	# deno coverage coverage/schema/
	deno coverage coverage/schema/ --lcov --output=coverage/schema.lcov
	deno coverage coverage/schema/ --html

schema-build:
	deno task -c packages/schema/deno.json build
