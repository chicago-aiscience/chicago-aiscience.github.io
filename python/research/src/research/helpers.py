from html.parser import HTMLParser
from typing import NamedTuple


class ResearchElt(NamedTuple):
    tag: str
    type: str


class FindResearchBrowser(HTMLParser):
    research_divs: list[ResearchElt]

    def __init__(self):
        super().__init__()
        self.research_divs = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "research-browser":
            return

        attributes = {k: v for k, v in attrs if v is not None}
        if "type" not in attributes:
            return

        browser_type = attributes.get("type", "")

        self.research_divs.append(
            ResearchElt(
                tag=tag,
                type=browser_type,
            )
        )
