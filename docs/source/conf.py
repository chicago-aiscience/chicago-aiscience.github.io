"""generate docs site"""

from pathlib import Path

from sphinx.application import Sphinx  # type: ignore

SPHINX_BUILD_FINISHED_EVENT = "build-finished"
DOT_NOJEKYLL = ".nojekyll"

project = "AI + Sci"
copyright = "2024, Chris Redmond"
author = "Chris Redmond"
release = "0.1.0"
root_doc = "index"

# research
research_options: dict[str, str | list[str] | Path] = {
    "types": ["researchers", "papers"],
}

# general config
extensions = [
    "myst_parser",
    "sphinxcontrib.mermaid",
    "research",
]
templates_path = ["_templates"]
exclude_patterns: list[str] = []
source_suffix = {
    ".md": "markdown",
}


# HTML output options
html_title = "AI Science"
html_static_path = ["_static"]
html_css_files = ["custom.css"]
html_favicon = "_static/favicon-v0.svg"

html_context = {
    # "github_user": "chicago-aiscience",
    "github_repo": "chicago-aiscience.github.io",
    "github_version": "develop",
    "doc_path": "docs/source/",
}

html_theme = "furo"
# html_theme_options = {
#     "light_css_variables": {
#     }
# }

# html_sidebars = {}


# myst + plugins
myst_links_external_new_tab = True
myst_enable_extensions = [
    "colon_fence",
    "tasklist",
    "deflist",
]


# setup


def create_nojekyll(app: Sphinx, exception: Exception | None) -> None:
    """adds a .nojekyll file to the output bundle for proper publishing to gh-pages"""
    nojekyll_path = Path(app.outdir, DOT_NOJEKYLL)
    if exception is None:
        nojekyll_path.touch()


def setup(app: Sphinx) -> None:
    app.connect(SPHINX_BUILD_FINISHED_EVENT, create_nojekyll)
