from sphinx.domains import Domain

from .directives import BrowserDirective


class Research(Domain):
    name = "research"
    directives = {"browser": BrowserDirective}

    def resolve_any_xref(self, env, fromdocname, builder, target, node, contnode):
        return []
