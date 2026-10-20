from .existing import EXISTING
from .extras import EXTRAS
from .priority import PRIORITY

# Display order on the Templates page: the five priority forms first.
CATALOG: list[dict] = [*PRIORITY, *EXISTING, *EXTRAS]
_BY_KEY = {t["key"]: t for t in CATALOG}


def catalog_entry(key: str) -> dict | None:
    return _BY_KEY.get(key)
