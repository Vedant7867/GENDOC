"""Templates already listed in the frontend's TEMPLATES_LIST (ids/titles/prompts kept)."""
from .common import field, fields, kv, person, person_specs, sig_block

_notice_html = f"""
<table><tbody><tr><td>Ref: {{{{refNo}}}}</td><td style="text-align: right">Date: {{{{documentDate}}}}</td></tr></tbody></table>
<h1 style="text-align: center">NOTICE</h1>
<h2 style="text-align: center">{{{{eventTitle}}}}</h2>
<p>{{{{chapterName}}}} is pleased to announce <strong>{{{{eventTitle}}}}</strong>. {{{{summary}}}}</p>
{kv([
  ("Date", "{{eventDate}}"), ("Time", "{{eventTime}}"), ("Venue", "{{venue}}"),
  ("Eligibility", "{{targetAudience}}"), ("Registration", "{{registrationLink}}"),
  ("Last date to register", "{{registrationDeadline}}"),
  ("Contact", "{{contactName}} ({{contactMobile}})"),
])}
<p>All interested students are encouraged to participate.</p>
{sig_block(["<br><br><br>{{studentHeadName}}<br>{{studentHeadDesignation}}, {{chapterName}}", "<br><br><br>{{facultyChairmanName}}<br>{{facultyChairmanDesignation}}, {{chapterName}}"])}
"""
EVENT_NOTICE = {
    "key": "event-notice", "title": "Event Notice", "templateType": "Event Notice", "category": "Publicity",
    "iconName": "FileText", "theme": "emerald", "previewHeading": "EVENT NOTICE", "wireframeVariant": "letter",
    "catalogVersion": 1,
    "description": "Crisp circular notice for noticeboards, departmental distribution and club channels.",
    "suggestedPrompt": "Departmental notice announcing registrations open for ACM Web Development Workshop 2026 with QR code and link.",
    "html": _notice_html,
    "fields": fields(
        "refNo", "documentDate!", "chapterName!", "eventTitle!", "summary!", "eventDate!", "eventTime", "venue!",
        "targetAudience!",
        field("registrationLink", "Registration link", group="Event", example="https://forms.gle/example"),
        field("registrationDeadline", "Registration deadline", group="Event", example="10 October 2026"),
        "contactName", "contactMobile", "studentHeadName!", "studentHeadDesignation!",
        "facultyChairmanName!", "facultyChairmanDesignation!",
    ),
}

_budget_html = f"""
<h1 style="text-align: center">BUDGET ESTIMATE</h1>
{kv([("Event", "{{eventTitle}}"), ("Date(s)", "{{eventDate}}"), ("Venue", "{{venue}}"), ("Expected participants", "{{expectedAttendance}}")])}
<table>
<thead><tr><th>Sr. No.</th><th>Item</th><th>Details</th><th>Qty</th><th>Amount (Rs)</th></tr></thead>
<tbody><tr><td>{{{{budgetItems}}}}</td></tr></tbody>
<tbody>
<tr><td></td><td><strong>Contingency</strong></td><td></td><td></td><td>{{{{contingency}}}}</td></tr>
<tr><td></td><td><strong>Total estimated expenditure</strong></td><td></td><td></td><td><strong>{{{{budgetTotal}}}}</strong></td></tr>
</tbody>
</table>
<p>Prepared by: {{{{preparedBy}}}}</p>
{sig_block([person("Student Head", "studentHead", lines=("Mobile",)), person("Faculty Chairman", "facultyChairman", lines=("Dept",))])}
"""
BUDGET_ESTIMATE = {
    "key": "budget-estimate", "title": "Budget Estimate", "templateType": "Budget Estimate", "category": "Finance",
    "iconName": "FileSpreadsheet", "theme": "purple", "previewHeading": "BUDGET ESTIMATE", "wireframeVariant": "bill-table",
    "catalogVersion": 1,
    "description": "Tabular financial breakdown: refreshments, printing, honorarium, infrastructure and contingency reserve.",
    "suggestedPrompt": "Budget estimation sheet for 120 participants workshop including refreshments (Rs 9,000), speaker gift (Rs 4,000), certificates (Rs 3,000).",
    "html": _budget_html,
    "fields": fields(
        "eventTitle!", "eventDate!", "venue!", "expectedAttendance!",
        field("budgetItems", "Budget items", "table", required=True, official=True, group="Finance", autoNumber=True,
              columns=[{"key": "item", "label": "Item"}, {"key": "details", "label": "Details"},
                       {"key": "quantity", "label": "Qty"}, {"key": "amount", "label": "Amount (Rs)"}],
              example=[{"item": "Refreshments", "details": "Tea & snacks", "quantity": "120", "amount": "9000"},
                       {"item": "Speaker gift", "details": "Memento", "quantity": "1", "amount": "4000"},
                       {"item": "Certificates", "details": "Printing", "quantity": "120", "amount": "3000"}]),
        field("contingency", "Contingency (₹)", "currency", official=True, group="Finance", defaultValue="0", example="1000"),
        "budgetTotal!",
        field("preparedBy", "Prepared by", group="Signatories", example="Finance & Logistics Team"),
        "studentHeadName!", "studentHeadMobile", "facultyChairmanName!", "facultyChairmanDept",
    ),
}

_cert_html = f"""
<h1 style="text-align: center">CERTIFICATE OF PARTICIPATION</h1>
<p style="text-align: center">This is to certify that</p>
<h2 style="text-align: center">{{{{recipientName}}}}</h2>
<p style="text-align: center">(Roll No. {{{{recipientRollNo}}}}, {{{{recipientDepartment}}}})</p>
<p style="text-align: center">has participated in <strong>{{{{eventTitle}}}}</strong> organized by {{{{chapterName}}}}, held on {{{{eventDate}}}} at {{{{venue}}}}.</p>
<p style="text-align: center">Certificate ID: {{{{certificateId}}}}</p>
{sig_block(["<br><br><br><strong>{{studentHeadName}}</strong><br>Student Head, {{chapterName}}", "<br><br><br><strong>{{facultyChairmanName}}</strong><br>Faculty Chairman, {{chapterName}}"])}
"""
PARTICIPATION_CERTIFICATE = {
    "key": "participation-certificate", "title": "Participation Certificate", "templateType": "Participation Certificate",
    "category": "Recognition", "iconName": "Award", "theme": "indigo", "previewHeading": "CERTIFICATE OF PARTICIPATION",
    "wireframeVariant": "letter", "catalogVersion": 1,
    "description": "Standard chapter certificate with recipient name, event, date, credential ID and authorised signatures.",
    "suggestedPrompt": "Participation certificate template for student attendees of ACM Web Development Workshop held on 14-15 October 2026.",
    "html": _cert_html,
    "fields": fields("recipientName!", "recipientRollNo", "recipientDepartment", "eventTitle!", "chapterName!",
                     "eventDate!", "venue", "certificateId", "studentHeadName!", "facultyChairmanName!"),
}

EXISTING = [EVENT_NOTICE, BUDGET_ESTIMATE, PARTICIPATION_CERTIFICATE]
