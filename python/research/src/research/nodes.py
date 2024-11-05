from docutils import nodes
from sphinx.writers.html import HTMLTranslator

# TODO: Should be a nice way to make this fallback... this isn't it and I'm not sure what it is


class BrowserNode(nodes.General, nodes.Element): ...


def visit_research_browser_html(self: HTMLTranslator, node: BrowserNode) -> None:
    tag_open = f'<research-browser type="{node["typeof"]}"'
    try:
        tag_open += f'title="{node["title"]}"'
    except KeyError:
        pass
    tag_open += ">"
    self.body.append(tag_open)


def depart_research_browser_html(self: HTMLTranslator, node: BrowserNode) -> None:
    self.body.append("</research-browser>")
