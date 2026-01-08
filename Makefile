# Configuration
VENV := .venv
DOCS_DIR := docs
BUILD_DIR := $(DOCS_DIR)/_build
HTML_DIR := $(BUILD_DIR)/html
PORT := 8000

# Detect if uv is available
UV := $(shell command -v uv 2> /dev/null)
PYTHON := $(shell command -v python3 2> /dev/null || command -v python 2> /dev/null)

.PHONY: help install build serve clean rebuild check

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
build: install
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
	@echo "Check complete!"
