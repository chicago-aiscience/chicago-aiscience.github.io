"""research"""

import shutil
from pathlib import Path

from sphinx.application import Sphinx

from .domain import Research
from .nodes import BrowserNode, depart_research_browser_html, visit_research_browser_html

BASE_DIR = Path(".")


def copy_bundle(app: Sphinx, exc):
    if app.builder.format == "html" and not exc:
        scripts_dir = Path(app.outdir) / "_static" / "scripts"
        scripts_dir.mkdir(exist_ok=True)

        bundle_name = "bundle-v0.1.1.js"
        bundle_path = Path(__file__).parent / "assets" / "scripts" / bundle_name
        shutil.copyfile(bundle_path, scripts_dir / bundle_name)


def copy_data(app: Sphinx, exc):
    if app.builder.format == "html" and not exc:
        data_dir = Path(app.outdir) / "_static" / "data"
        data_dir.mkdir(exist_ok=True)

        gen_assets = BASE_DIR / "gen_assets"

        researchers_jsonl = gen_assets / "researchers.jsonl"
        shutil.copyfile(researchers_jsonl, data_dir / "researchers.jsonl")

        papers_jsonl = gen_assets / "papers.jsonl"
        shutil.copyfile(papers_jsonl, data_dir / "papers.jsonl")


def setup(app: Sphinx) -> str:
    app.add_config_value(
        name="research_options",
        default=None,
        rebuild="html",
        types=dict,
        description="Options for research browser injection",
    )
    app.add_node(BrowserNode, html=(visit_research_browser_html, depart_research_browser_html))
    app.add_domain(Research)
    app.add_js_file("scripts/bundle-v0.1.1.js")
    app.connect("build-finished", copy_bundle)
    app.connect("build-finished", copy_data)
    return {
        "version": "0.1.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
