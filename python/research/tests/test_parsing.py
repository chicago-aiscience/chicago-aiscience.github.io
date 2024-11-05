import pytest
from research.directives import InvalidBrowserType
from sphinx.testing.fixtures import SphinxTestApp


@pytest.mark.sphinx("html", testroot="parsing-empty-config-bad-key")
def test_parsing_directive_type_without_configuring_types_errors(app: SphinxTestApp):
    with pytest.raises(InvalidBrowserType):
        app.build()


# @pytest.mark.sphinx("html", testroot="parsing-empty-config-no-key")
# def test_parsing_missing_directive_type_without_configuring_types_errors(app: SphinxTestApp):

#     with pytest.raises(SphinxError):
#         app.build()


@pytest.mark.sphinx("html", testroot="parsing-simple-config-bad-key")
def test_parsing_missing_directive_type_with_configured_types_errors(app: SphinxTestApp):
    with pytest.raises(InvalidBrowserType):
        app.build()


# @pytest.mark.sphinx("html", testroot="parsing-simple-config-no-key")
# def test_parsing_no_directive_type_with_configured_types_errors(app: SphinxTestApp):

#     with pytest.raises(SphinxError):
#         app.build()


@pytest.mark.sphinx("html", testroot="parsing-simple-config-good-key")
def test_parsing_good_directive_type_with_configured_types_passes(app: SphinxTestApp):
    app.build()
