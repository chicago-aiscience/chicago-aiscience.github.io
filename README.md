# UChicago AI + Science Research Software Engineering Website

This repository contains the website for the University of Chicago AI + Science Institute's Research Software Engineering hub, built with [Jupyter Book](https://jupyterbook.org/) using [MyST Markdown](https://mystmd.org/).

## Project Structure

```
.
├── docs/                    # Source content directory
│   ├── index.md             # Homepage
│   ├── projects.md          # Software projects showcase
│   ├── rse.md               # Research Software Engineering info
│   ├── get_help.md          # Contact and office hours
│   ├── workshops/           # Workshop content
│   ├── images/              # Image assets
│   ├── styles/              # Custom CSS
│   └── myst.yml             # MyST site configuration
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions deployment workflow
├── pyproject.toml           # Python dependencies
├── uv.lock                  # Locked dependency versions
├── Makefile                 # Convenient development commands
└── README.md                # This file
```

## Prerequisites

- **Python 3.13+** (as specified in `pyproject.toml`)
- **uv** - Fast Python package installer and resolver ([installation guide](https://github.com/astral-sh/uv#installation))
- **Node.js 18.x+** - Required for Jupyter Book when installed via npm (used in CI; local development uses Python/uv)

## Local Development

> **Tip**: The project includes a `Makefile` with convenient shortcuts. See the [Using the Makefile](#using-the-makefile) section for an easier way to run these commands.

### 1. Install Dependencies

Using `uv` (recommended):

```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install Python dependencies
uv sync
```

This will install Jupyter Book and all required dependencies into a virtual environment managed by `uv`.

### 2. Build and Serve the Site

**Option A: Build and serve in one command (recommended)**

The easiest way to develop locally is to use `jupyter book start`, which builds and serves the site:

```bash
# Activate the virtual environment (if needed)
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate     # On Windows

# Build and serve the site
cd docs
jupyter book start
```

This will build the site and start a local development server. The site will be available at `http://localhost:3000` and will automatically rebuild when you make changes.

**Option B: Build only**

If you just want to build without serving:

```bash
cd docs
jupyter book build --html
```

The built site will be available in `docs/_build/html/`.

### 4. Make Changes

1. Edit Markdown files in the `docs/` directory
2. Modify `docs/myst.yml` to update site configuration
3. Add custom CSS in `docs/styles/custom.css`
4. If using `jupyter book start`, the site will automatically rebuild. Otherwise, rebuild manually:
   ```bash
   cd docs
   jupyter book build --html
   ```

## Using the Makefile

The project includes a `Makefile` that provides convenient shortcuts for common development tasks. All commands should be run from the repository root.

### Available Commands

**`make help`** (or just `make`)
- Shows all available Makefile targets and their descriptions

**`make install`**
- Installs all Python dependencies using `uv sync`
- Creates a virtual environment if it doesn't exist
- Required before building or serving the site

**`make build`**
- Installs dependencies (if needed) and builds the Jupyter Book site
- Output is available in `docs/_build/html/`
- Equivalent to: `cd docs && jupyter book build`

**`make serve`**
- Installs dependencies (if needed) and starts the development server
- Builds and serves the site using `jupyter book start`
- The site will be available at `http://localhost:8000` (or the next available port)
- Automatically rebuilds when you make changes
- Press `Ctrl+C` to stop the server

**`make clean`**
- Removes all build artifacts from `docs/_build/`
- Useful when you want to do a fresh build

**`make rebuild`**
- Cleans build artifacts and rebuilds the site
- Equivalent to: `make clean && make build`

**`make check`**
- Checks your development environment setup
- Verifies Python, uv, virtual environment, and build directory
- Useful for troubleshooting setup issues

### Quick Start with Makefile

```bash
# Install dependencies
make install

# Build and serve the site
make serve

# In another terminal, check your setup
make check
```

### Examples

```bash
# Clean build from scratch
make rebuild

# Just build without serving
make build

# Check if everything is set up correctly
make check

# Clean up build files
make clean
```

## GitHub Actions Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### How It Works

1. **Trigger**: Pushes to the `main` branch trigger the deployment workflow
2. **Build Process**:
   - Checks out the repository
   - Sets up Node.js 18.x
   - Installs Jupyter Book via npm (uses `jupyter-book` command with hyphen)
   - Builds the site from the `docs/` directory
   - Uploads the built HTML as an artifact
3. **Deployment**: The artifact is automatically deployed to GitHub Pages

### Workflow File

The deployment configuration is in `.github/workflows/deploy.yml`. Key settings:

- **Build directory**: `docs/` (specified via `working-directory`)
- **Output directory**: `docs/_build/html`
- **Base URL**: Empty (`BASE_URL: ''`) for the `chicago-aiscience.github.io` domain

### Setting Up GitHub Pages

1. Go to your repository's **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The workflow will automatically deploy on pushes to `main`

### Manual Deployment

If you need to trigger a deployment manually:

1. Make a commit and push to `main`:
   ```bash
   git add .
   git commit -m "Update site content"
   git push origin main
   ```
2. Check the **Actions** tab in GitHub to monitor the deployment
3. Once complete, your site will be live at `https://chicago-aiscience.github.io`

## Development Tips

### Adding New Pages

1. Create a new Markdown file in `docs/` (e.g., `docs/new-page.md`)
2. Add it to the table of contents in `docs/myst.yml`:
   ```yaml
   toc:
     - file: index.md
     - file: new-page.md
   ```
3. Rebuild to see your changes

### Adding Images

1. Place images in `docs/images/`
2. Reference them in Markdown:
   ```markdown
   ```{image} images/my-image.png
   :width: 500px
   ```
   ```

### Custom Styling

- Add custom CSS to `docs/styles/custom.css`
- The stylesheet is automatically included via `myst.yml` configuration

### MyST Directives

This site uses MyST Markdown, which supports:
- **Cards**: `:::{card} ... :::`
- **Grids**: `::::{grid} ... ::::`
- **Images**: ````{image} ... ````
- **Admonitions**: `:::{note} ... :::`

See the [MyST documentation](https://mystmd.org/guide) for more directives.

## Troubleshooting

### Build Errors

If you encounter build errors:

1. **Check Python version**: Ensure you're using Python 3.13+
   ```bash
   python --version
   ```

2. **Reinstall dependencies**:
   ```bash
   uv sync --reinstall
   ```

3. **Clear build cache**:
   ```bash
   rm -rf docs/_build
   jupyter book build
   ```

### GitHub Actions Failures

If the GitHub Actions workflow fails:

1. Check the **Actions** tab for error messages
2. Verify that GitHub Pages is configured to use **GitHub Actions** as the source
3. Ensure the `docs/` directory structure is correct
4. Check that `docs/myst.yml` is valid YAML

## Resources

- [Jupyter Book Documentation](https://jupyterbook.org/)
- [MyST Markdown Guide](https://mystmd.org/guide)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [uv Documentation](https://github.com/astral-sh/uv)

## License

[MIT License](LICENSE)
