# Configuration
VENV := .venv
DOCS_DIR := docs
BUILD_DIR := $(DOCS_DIR)/_build
HTML_DIR := $(BUILD_DIR)/html
PORT := 8000

# Detect if uv is available
UV := $(shell command -v uv 2> /dev/null)
PYTHON := $(shell command -v python3 2> /dev/null || command -v python 2> /dev/null)

.PHONY: help install build serve clean rebuild check check-invisibles

# Default target
help:
	@echo "Available targets:"
	@echo "  make install    - Install dependencies using uv"
	@echo "  make build      - Build the Jupyter Book site"
	@echo "  make serve      - Build and serve the site locally using 'jupyter book start'"
	@echo "  make clean      - Remove build artifacts"
	@echo "  make rebuild    - Clean and rebuild the site"
	@echo "  make check      - Check for common issues"

# Install dependencies
install:
ifeq ($(UV),)
	@echo "Error: uv is not installed. Install it from https://github.com/astral-sh/uv"
	@exit 1
endif
	@echo "Installing dependencies with uv..."
	uv sync
	@echo "Dependencies installed successfully!"

# Build the Jupyter Book site
build: install check-invisibles
	@echo "Building Jupyter Book site..."
	cd $(DOCS_DIR) && $(if $(UV),uv run jupyter book build --html,jupyter book build --html)
	@echo "Build complete! Output available in $(HTML_DIR)"

# Serve the site locally (builds and hosts)
serve: install
	@echo "Starting Jupyter Book development server..."
	@echo "The site will be available at http://localhost:8000 (or the next available port)"
	@echo "Press Ctrl+C to stop the server"
	cd $(DOCS_DIR) && $(if $(UV),uv run jupyter book start,jupyter book start)

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)
	@echo "Clean complete!"

# Rebuild: clean and build
rebuild: clean build

# Check for common issues
check:
	@echo "Checking project setup..."
	@echo -n "Python: "
	@$(PYTHON) --version 2>/dev/null || echo "NOT FOUND"
	@echo -n "uv: "
	@$(if $(UV),echo "FOUND ($(UV))",echo "NOT FOUND - Install from https://github.com/astral-sh/uv")
	@echo -n "Virtual environment: "
	@test -d $(VENV) && echo "EXISTS" || echo "NOT FOUND (run 'make install' first)"
	@echo -n "Build directory: "
	@test -d $(HTML_DIR) && echo "EXISTS" || echo "NOT FOUND (run 'make build' first)"
	@$(MAKE) --no-print-directory check-invisibles
	@echo "Check complete!"

# Fail if invisible characters sneak into source Markdown. Zero-width spaces
# (U+200B/C/D), the word joiner (U+2060), and a stray BOM (U+FEFF) are invisible
# in an editor but silently break MyST parsing -- e.g. one before a ``` fence
# makes the whole code block render as a paragraph. Excludes the _build output.
check-invisibles:
	@echo "Scanning source Markdown for invisible characters..."
	@hits=$$(find $(DOCS_DIR) -name '*.md' -not -path '*/_build/*' -print0 | \
		xargs -0 perl -CSD -ne 'if (/[\x{200b}\x{200c}\x{200d}\x{2060}\x{feff}]/) { my $$l=$$_; $$l=~s/[\x{200b}\x{200c}\x{200d}\x{2060}\x{feff}]/<INVIS>/g; print "  $$ARGV:$$.: $$l"; } close ARGV if eof;'); \
	if [ -n "$$hits" ]; then \
		echo "ERROR: invisible characters found (shown as <INVIS>):"; \
		echo "$$hits"; \
		echo "Fix with: perl -CSD -i -pe 's/[\\x{200b}\\x{200c}\\x{200d}\\x{2060}\\x{feff}]//g' <file>"; \
		exit 1; \
	else \
		echo "OK -- no invisible characters found."; \
	fi
