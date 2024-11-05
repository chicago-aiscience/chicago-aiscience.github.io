import pytest
from sphinx.testing.fixtures import SphinxTestApp


@pytest.mark.sphinx("html", testroot="parsing-simple-config-good-key")
def test_browser_directive_renders_to_html_text(app: SphinxTestApp):
    app.build()
    content = (app.outdir / "index.html").read_text()
    assert "research-browser" in content
    assert '<research-browser type="items">' in content
    assert "</research-browser>" in content


@pytest.mark.sphinx("html", testroot="parsing-simple-config-multiple-instances")
def test_multiple_browser_directives_on_page_coexist_html(app: SphinxTestApp):
    app.build()
    content = (app.outdir / "index.html").read_text()
    assert '<research-browser type="items">' in content
    assert '<research-browser type="things">' in content
