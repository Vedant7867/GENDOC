"""Role rules from contract section 7 ("Roles" table). Pure functions, easy to test."""
MEMBER = "Club Member"
COORDINATOR = "Core Coordinator"
ADMIN = "Club Admin"
FACULTY = "Faculty Advisor"

STATUSES = ("Draft", "Needs Review", "Completed")


def is_owner(user: dict, doc: dict) -> bool:
    return doc.get("ownerId") == user["id"]


def can_create(user: dict) -> bool:
    return user["role"] in {MEMBER, COORDINATOR, ADMIN}


def can_edit(user: dict, doc: dict) -> bool:
    """Who may change content or details (Completed documents are locked separately)."""
    role = user["role"]
    if role in {COORDINATOR, ADMIN}:
        return True
    return role == MEMBER and is_owner(user, doc)


def can_delete(user: dict, doc: dict) -> bool:
    role = user["role"]
    if role == ADMIN:
        return True
    if role == COORDINATOR:
        return doc["status"] != "Completed"
    if role == MEMBER:
        return is_owner(user, doc) and doc["status"] == "Draft"
    return False


# (from, to) -> roles allowed. MEMBER is limited to their own documents.
_TRANSITIONS: dict[tuple[str, str], set[str]] = {
    ("Draft", "Needs Review"): {MEMBER, COORDINATOR, ADMIN},
    ("Needs Review", "Draft"): {MEMBER, COORDINATOR, ADMIN, FACULTY},  # withdraw / request changes
    ("Needs Review", "Completed"): {COORDINATOR, ADMIN, FACULTY},
    ("Completed", "Draft"): {COORDINATOR, ADMIN},  # reopen
}


def check_transition(user: dict, doc: dict, new_status: str) -> str:
    """Returns 'ok', 'forbidden' or 'invalid'."""
    roles = _TRANSITIONS.get((doc["status"], new_status))
    if roles is None:
        return "invalid"
    if user["role"] not in roles:
        return "forbidden"
    if user["role"] == MEMBER and not is_owner(user, doc):
        return "forbidden"
    return "ok"
