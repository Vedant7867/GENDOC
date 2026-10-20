"""Shared field vocabulary for every template.

Same key => same meaning in every document, which is how names, dates and
venues stay identical across the documents of one event (contract s.4).
Keys that the contract's `documents` record also stores (venue, eventDate,
expectedAttendance, budgetTotal, summary, organizer) deliberately reuse its names.

Spec mini-language for `fields(...)`:  "venue"  optional   |  "venue!"  required
or a dict for template-specific fields.
"""
from __future__ import annotations

from typing import Any


def _c(label, type="text", *, official=False, group=None, example=None, default=None, **kw):
    d: dict[str, Any] = {"label": label, "type": type, "official": official}
    if group: d["group"] = group
    if example is not None: d["example"] = example
    if default is not None: d["defaultValue"] = default
    d.update(kw)
    return d


def _person(prefix, who, group, *, roll=True, branch=True, dept=False, desig=None, example=None):
    ex = example or {}
    out = {f"{prefix}Name": _c(f"{who} name", official=True, group=group, example=ex.get("name"),
                               prefill=ex.get("prefill"))}
    if desig is not None:
        out[f"{prefix}Designation"] = _c(f"{who} designation", official=True, group=group,
                                         default=desig, example=ex.get("designation"))
    if roll:
        out[f"{prefix}RollNo"] = _c(f"{who} roll / admission no.", official=True, group=group, example=ex.get("roll"))
    if branch:
        out[f"{prefix}Branch"] = _c(f"{who} branch", official=True, group=group, example=ex.get("branch"))
    if dept:
        out[f"{prefix}Dept"] = _c(f"{who} department", official=True, group=group, example=ex.get("dept"))
    out[f"{prefix}Mobile"] = _c(f"{who} mobile no.", official=True, group=group, example=ex.get("mobile"))
    return out


COMMON: dict[str, dict] = {
    # --- document header
    "refNo": _c("Reference / approval note no.", official=True, group="Document", example="ACM/2026-27/SIH/001"),
    "documentDate": _c("Document date", "date", group="Document", example="08/09/2026"),
    "submittedTo": _c("Submitted to", group="Document", default="Dean (Students Welfare)", example="Dean (Students Welfare)"),
    "chapterName": _c("Chapter / club name", group="Document", example="ACM", prefill="club.name"),
    "chapterCode": _c("Chapter / club code no.", official=True, group="Document", example="6/52"),
    # --- event
    "eventTitle": _c("Event title", group="Event", example="Internal Hackathon of SIH"),
    "eventCategory": _c("Event category", group="Event", example="Hackathon"),
    "eventDate": _c("Event date(s)", group="Event", example="September 12th 2026", helpText="Free text, e.g. 14–15 October 2026"),
    "eventTime": _c("Event time", group="Event", example="06:00 PM to 07:30 PM"),
    "venue": _c("Venue", group="Event", example="CSE Department"),
    "summary": _c("Brief description", "textarea", group="Event",
                  example="The Internal Hackathon for Smart India Hackathon (SIH) is an institute-level selection round to shortlist the best student teams for the national stage."),
    "objectives": _c("Objectives", "textarea", group="Event",
                     example="To foster innovation and problem-solving, encourage teamwork and creativity, and select the most promising projects."),
    "targetAudience": _c("Target audience", group="Event", example="All year students"),
    "expectedAttendance": _c("Expected number of participants", group="Event", example="1000+"),
    "mode": _c("Mode", "select", group="Event", options=["Offline", "Online", "Hybrid"], default="Offline", example="Offline"),
    "organizer": _c("Organizers", group="Event", example="ACM Core 2026-27"),
    "judges": _c("Name of judges", group="Event", example="Dr. Alok Kumar"),
    # --- money
    "budgetTotal": _c("Total amount (₹)", "currency", official=True, group="Finance", example="1100"),
    # --- people
    **_person("studentHead", "Student head", "Signatories", desig="Chairperson",
              example={"name": "Ansh Gupta", "prefill": "signatory:Student Head", "roll": "I24AI005", "branch": "AI", "mobile": "+91 87806 37299"}),
    **_person("studentSecretary", "Student secretary", "Signatories",
              example={"name": "Arshad Khatib", "prefill": "signatory:Student Secretary", "roll": "U24AI112", "branch": "AI", "mobile": "+91 88060 45005"}),
    **_person("facultyChairman", "Faculty chairman", "Signatories", roll=False, branch=False, dept=True, desig="Chairman",
              example={"name": "Dr. Sankita Patel", "prefill": "signatory:Faculty Chairman", "dept": "CSE", "mobile": "+91 98792 20919"}),
    **_person("facultyCoChairman", "Faculty co-chairman", "Signatories", roll=False, branch=False, dept=True, desig="Co-Chairman",
              example={"name": "Dr. Balu Parne", "prefill": "signatory:Faculty Co-Chairman", "dept": "CSE", "mobile": "+91 94224 48729"}),
    # --- approving authorities (office block of the Dean SW form)
    "fswChairmanName": _c("Chairman, F&SW", official=True, group="Approving authorities", default="Dr. Rakesh Maurya"),
    "assocDeanName": _c("Associate Dean (SW)", official=True, group="Approving authorities", default="Dr. Manish K Rathod"),
    "deanName": _c("Dean (Students Welfare)", official=True, group="Approving authorities", default="Dr. Sanjay R. Patel"),
    # --- recipients / certificates
    "recipientName": _c("Recipient name", group="Recipient", example="Aarav Mehta"),
    "recipientRollNo": _c("Recipient roll no.", official=True, group="Recipient", example="U24CS045"),
    "recipientDepartment": _c("Recipient department", group="Recipient", example="Computer Science & Engineering"),
    "certificateId": _c("Certificate ID", official=True, group="Recipient", example="ACM-2026-0142"),
    "contactName": _c("Contact person", group="Contact", example="Arshad Khatib"),
    "contactMobile": _c("Contact mobile no.", group="Contact", example="+91 88060 45005"),
}


def fields(*specs) -> list[dict]:
    out = []
    for s in specs:
        if isinstance(s, dict):
            out.append(s)
            continue
        over: dict = {}
        if isinstance(s, tuple):  # ("key!", {overrides})
            s, over = s
        required = s.endswith("!")
        key = s.rstrip("!")
        out.append({"key": key, "required": required, **COMMON[key], **over})
    return out


def field(key, label, type="text", *, required=False, official=False, **kw) -> dict:
    d = {"key": key, "label": label, "type": type, "required": required, "official": official}
    d.update({k: v for k, v in kw.items() if v is not None})
    return d


def person_specs(prefix, *, skip=()):
    """All fields of one person block, e.g. person_specs('studentHead').
    Mobile numbers are optional, everything else in the block is required."""
    keys = [k for k in COMMON if k.startswith(prefix) and k[len(prefix):][:1].isupper()]
    return [k if k.endswith("Mobile") else k + "!" for k in keys if k[len(prefix):] not in skip]


# ------------------------------------------------------------ html helpers
def kv(rows: list[tuple[str, str]]) -> str:
    body = "".join(f"<tr><th>{l}</th><td>{v}</td></tr>" for l, v in rows)
    return f"<table><tbody>{body}</tbody></table>"


def sig_block(cells: list[str]) -> str:
    """Signature table, two cells per row. Each cell is raw html."""
    rows = []
    for i in range(0, len(cells), 2):
        pair = cells[i:i + 2] + [""] * (2 - len(cells[i:i + 2]))
        rows.append("<tr>" + "".join(f"<td>{c}</td>" for c in pair) + "</tr>")
    return '<table class="sig-table"><tbody>' + "".join(rows) + "</tbody></table>"


def person(title: str, prefix: str, *, lines=("RollNo", "Branch", "Mobile"), desig=False) -> str:
    labels = {"RollNo": "Roll No.", "Branch": "Branch", "Mobile": "Mobile No.", "Dept": "Dept", "Designation": "Designation"}
    parts = [f"<strong>{title}</strong><br><br><br>Name: {{{{{prefix}Name}}}}"]
    if desig:
        parts.append(f"Designation: {{{{{prefix}Designation}}}}")
    parts += [f"{labels[l]}: {{{{{prefix}{l}}}}}" for l in lines]
    return "<br>".join(parts)


def blank_rows(n: int, cols: int) -> str:
    return ("<tr>" + "<td>&nbsp;</td>" * cols + "</tr>") * n
