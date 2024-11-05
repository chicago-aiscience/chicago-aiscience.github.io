"""fixtures"""

from pathlib import Path

import pytest

pytest_plugins = ["sphinx.testing.fixtures"]


@pytest.fixture
def rootdir() -> Path:
    return Path(__file__).parent / "fixtures"
