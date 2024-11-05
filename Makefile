SHELL = /bin/sh -eux
PYTHON = python3

# python projects
RESEARCH_DIR = python/research/

# ts projects
MESSY_DIR = typescript/messyscrape/
BROWSE_DIR = typescript/browse/


all: install docs open

lint:
	@deno fmt --config deno.jsonc
	@uvx pre-commit run --all-files

docs:
	@uv venv .venv
	@uv pip sync docs/requirements-docs.txt
	@uv run sphinx-build docs/source/ docs/_build/

run: docs

install:
	# install tools
	@uv tool install pre-commit
	@uvx pre-commit install

	# compile dependencies
	@uv pip compile docs/requirements-docs.in --output-file docs/requirements-docs.txt --no-annotate

	# default to docs environment
	@uv venv .venv
	@uv pip sync docs/requirements-docs.txt

open:
	@$(PYTHON) -m webbrowser file://$(abspath .)/docs/_build/index.html

clean:
	@rm -f .DS_Store
	@rm -rf docs/_build/
	@find . -type d -name __pycache__ -exec rm -rf {} +

distclean: clean
	@find . -type d -name .venv -exec rm -rf {} +
	@rm -rf .mypy_cache/ .pytest_cache/ .ruff_cache/
	@rm -rf coverage/
	@rm -rf dist/

bootstrap: pybin = .venv/bin/
bootstrap:
	# bootstrap build tool
	@rm -rf .venv
	@$(PYTHON) -m venv .venv
	@$(pybin)pip install pipx
	@$(pybin)pipx install uv
	@$(pybin)pipx ensurepath
	@rm -rf .venv

	@uv python install 3.12
	@uv tool install pre-commit
	@uv tool install mypy
	@uvx pre-commit install
	@uvx pre-commit autoupdate

.PHONY: all install docs open clean distclean run bootstrap


# docs specific

check-docs:
	@uvx mypy docs


# messyscrape service

messy-run:
	deno task start:messyscrape

messy-check:
	deno task typecheck:messyscrape
	deno task test:messyscrape


# research-browser service

browse-run:
	echo 'TODO: setup an oak server to start a simple app with the component'

browse-check:
	# deno task typecheck:research-browser
	deno task test:research-browser

browse-build:
	deno task build:research-browser


# sphinx research browser extension

research-install:
	uv pip compile $(RESEARCH_DIR)pyproject.toml --output-file $(RESEARCH_DIR)requirements.txt --no-annotate
	uv pip compile $(RESEARCH_DIR)pyproject.toml $(RESEARCH_DIR)requirements-dev.in --output-file $(RESEARCH_DIR)requirements-dev.txt --no-annotate

	uv venv .venv
	uv pip sync $(RESEARCH_DIR)requirements.txt

research-check:
	# setup
	uv venv .venv
	uv pip sync $(RESEARCH_DIR)requirements-dev.txt

	# cmd
	uv run pytest -s $(RESEARCH_DIR)

research-run:

research-build:
