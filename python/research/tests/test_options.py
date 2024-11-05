"""testing app configuration"""

import pytest
from research.configs import read_research_options
from sphinx.testing.fixtures import SphinxTestApp


@pytest.mark.sphinx("html", testroot="config-empty")
def test_empty_config_values(app: SphinxTestApp):
    options = read_research_options(app)

    assert options.types == []


@pytest.mark.sphinx("html", testroot="config-simple")
def test_simple_config_values(app: SphinxTestApp):
    options = read_research_options(app)

    assert options.types == ["items"]
