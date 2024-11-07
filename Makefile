
install:
	deno task build --allow-scripts

run:
	deno task start

clean:

distclean:
	rm -rf node_modules/
	rm -rf dist/


.PHONY: install clean distclean
