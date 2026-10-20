"""Server-side enforcement of the HTML content rules (contract section 4).

There is ONE implementation, shared with the templates module, so a template body and a document body
are cleaned by exactly the same rules. This wrapper only adds the size limit and the API error.
"""
from .config import get_settings
from .errors import ApiError
from .modules.templates.html_rules import sanitize_html as _sanitize


def sanitize_html(html: str) -> str:
    """Strip everything the contract does not allow (AI-draft marks are kept). Never raises on bad markup."""
    if len(html) > get_settings().max_content_chars:
        raise ApiError(422, "validation_error", "Document content is too large")
    return _sanitize(html, allow_ai_marks=True)
