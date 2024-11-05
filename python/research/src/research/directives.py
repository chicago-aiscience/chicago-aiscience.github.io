from sphinx.directives import SphinxDirective

from research.configs import ResearchOptions, read_research_options
from research.nodes import BrowserNode


class MissingBrowserType(ValueError): ...


class InvalidBrowserType(ValueError): ...


class BrowserDirective(SphinxDirective):
    name = "browser"
    # TODO: some of these value error should really handled by Sphinx more carefully...
    # everything is "nitpicky" right now
    required_arguments = 1
    optional_arguments = 1
    final_argument_whitespace = True
    has_content = True
    option_spec = {}

    options: ResearchOptions

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.options = read_research_options(self.env.app)

    def run(self):
        if len(self.arguments) < 1:
            raise MissingBrowserType("Not enough arguments")

        node = BrowserNode()
        typeof, *rest = self.arguments
        node["typeof"] = typeof

        if len(rest) > 0:
            node["title"] = rest.pop(0)

        if typeof not in self.options.types:
            raise InvalidBrowserType("Type in browser directive arg invalid")

        if len(rest) > 0:
            raise ValueError("Too many browser directive args")

        return [node]
