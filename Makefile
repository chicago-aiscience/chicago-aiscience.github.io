
install:
	deno install
	deno task build

run:
	deno task start

check:
	deno task test

lint:
	deno fmt

clean:

distclean:
	rm -rf .astro/
	rm -rf node_modules/
	rm -rf dist/

	# probably don't want to remove lockfile anymore
	# was handy for debugging pages deployment Sharp issues
	# rm -f deno.lock

.PHONY: install run check clean distclean


scraper-check:
	deno test --config packages/scraper/deno.json --allow-read
