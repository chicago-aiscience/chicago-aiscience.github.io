"""Processing configs"""

from dataclasses import dataclass, field
from pathlib import Path

from sphinx.application import Sphinx


@dataclass
class ResearchOptions:
    data_dir: str | Path = field(default_factory=lambda: "_data")
    types: list[str] = field(default_factory=list)


def read_research_options(app: Sphinx) -> ResearchOptions:
    config_dict = getattr(app.config, "research_options", {})
    if config_dict is None:
        return ResearchOptions()
    return ResearchOptions(**config_dict)


class ResearchBrowserTypeError(RuntimeError): ...
