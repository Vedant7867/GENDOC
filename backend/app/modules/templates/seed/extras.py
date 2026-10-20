"""Additional templates a student chapter commonly needs."""
from .common import blank_rows, field, fields, kv, person, sig_block

HEAD_CHAIR = lambda: sig_block([  # noqa: E731
    "<br><br><br><strong>{{studentHeadName}}</strong><br>Student Head, {{chapterName}}",
    "<br><br><br><strong>{{facultyChairmanName}}</strong><br>Faculty Chairman, {{chapterName}}",
])


def _tpl(key, title, category, desc, prompt, html, flds, *, icon="FileText", theme="blue", wire="letter", ttype=None):
    return {"key": key, "title": title, "templateType": ttype or title, "category": category, "iconName": icon,
            "theme": theme, "previewHeading": title.upper(), "wireframeVariant": wire, "catalogVersion": 1,
            "description": desc, "suggestedPrompt": prompt, "html": html, "fields": flds}


def _hdr():
    return '<table><tbody><tr><td>Ref: {{refNo}}</td><td style="text-align: right">Date: {{documentDate}}</td></tr></tbody></table>'


SUBMITTED = _tpl(
    "submitted-document", "Submitted Document", "Submitted",
    "Forwarding letter with an enclosure checklist for final submission to authorities or committees.",
    "Forward the SIH Internal Hackathon proposal, bill summary and bill certificate to the Dean (Students Welfare).",
    _hdr() + """
<p><strong>To,</strong><br>{{submittedTo}}</p>
<p><strong>Subject:</strong> Submission of documents for {{eventTitle}}</p>
<p>Respected Sir/Madam,</p>
<p>With reference to the above subject, we are submitting the following documents for {{eventTitle}} held on {{eventDate}} at {{venue}}, for your kind perusal and necessary action.</p>
<p><strong>Enclosures:</strong></p>
<ol>{{enclosures}}</ol>
<p>Thanking you.</p>""" + HEAD_CHAIR(),
    fields("refNo", "documentDate!", "submittedTo!", "eventTitle!", "eventDate!", "venue!",
           field("enclosures", "Enclosures", "list", required=True, group="Document",
                 example=["Event proposal", "Bill summary", "Bill certificate (Form BC-R)", "Original invoices"]),
           "chapterName!", "studentHeadName!", "facultyChairmanName!"),
    icon="FileText", theme="emerald")

REPORT = _tpl(
    "event-report", "Event Report", "Reports",
    "Post-event report: attendance, highlights, outcomes, expenditure and feedback, ready for submission.",
    "Report for the SIH Internal Hackathon held on 12 September with 850 participants and Rs 1,100 spent.",
    """<h1 style="text-align: center">EVENT REPORT</h1>
<h2 style="text-align: center">{{eventTitle}}</h2>""" + kv([
        ("Organized by", "{{chapterName}}"), ("Date", "{{eventDate}}"), ("Venue", "{{venue}}"),
        ("Expected / actual participants", "{{expectedAttendance}} / {{actualAttendance}}"),
        ("Total expenditure", "{{budgetSpent}}")]) + """
<h3>About the event</h3><p>{{summary}}</p>
<h3>Objectives</h3><p>{{objectives}}</p>
<h3>Highlights</h3><ul>{{highlights}}</ul>
<h3>Outcomes</h3><p>{{outcomes}}</p>
<h3>Participant feedback</h3><p>{{feedbackSummary}}</p>
<h3>Challenges and suggestions</h3><p>{{challenges}}</p>""" + HEAD_CHAIR(),
    fields("eventTitle!", "chapterName!", "eventDate!", "venue!", "expectedAttendance!",
           field("actualAttendance", "Actual participants", required=True, group="Event", example="850"),
           field("budgetSpent", "Total expenditure (₹)", "currency", required=True, official=True, group="Finance", example="1100"),
           "summary!", "objectives",
           field("highlights", "Highlights", "list", required=True, group="Report",
                 example=["120 teams registered", "Top 6 teams shortlisted for SIH national round"]),
           field("outcomes", "Outcomes", "textarea", required=True, group="Report", example="Six teams selected to represent the institute."),
           field("feedbackSummary", "Participant feedback", "textarea", group="Report"),
           field("challenges", "Challenges and suggestions", "textarea", group="Report"),
           "studentHeadName!", "facultyChairmanName!"),
    icon="FileText", theme="blue")

SPEAKER = _tpl(
    "speaker-invitation", "Speaker Invitation", "Administration",
    "Formal invitation to an external speaker or judge, with session details and organiser contact.",
    "Invite Dr. Meera Iyer to deliver a talk on Generative AI on 14 October 2026 at Seminar Hall.",
    _hdr() + """
<p><strong>To,</strong><br>{{speakerName}}<br>{{speakerDesignation}}, {{speakerOrganization}}</p>
<p><strong>Subject:</strong> Invitation to {{sessionRole}} at {{eventTitle}}</p>
<p>Respected {{speakerName}},</p>
<p>{{chapterName}} is organizing <strong>{{eventTitle}}</strong> on {{eventDate}} at {{eventTime}} in {{venue}}, for {{targetAudience}} (about {{expectedAttendance}} participants). {{summary}}</p>
<p>We would be honoured to have you as {{sessionRole}} on the topic <strong>{{sessionTopic}}</strong>. We look forward to your kind acceptance.</p>
<p>For coordination, please contact {{contactName}} ({{contactMobile}}).</p>""" + HEAD_CHAIR(),
    fields("refNo", "documentDate!", "chapterName!",
           field("speakerName", "Speaker name", required=True, group="Speaker", example="Dr. Meera Iyer"),
           field("speakerDesignation", "Speaker designation", required=True, group="Speaker", example="Senior Research Scientist"),
           field("speakerOrganization", "Speaker organization", required=True, group="Speaker", example="IIT Bombay"),
           field("sessionRole", "Role", "select", required=True, group="Speaker", options=["Guest Speaker", "Chief Guest", "Judge", "Mentor"],
                 defaultValue="Guest Speaker", example="Guest Speaker"),
           field("sessionTopic", "Session topic", required=True, group="Speaker", example="Generative AI in practice"),
           "eventTitle!", "eventDate!", "eventTime!", "venue!", "targetAudience!", "expectedAttendance", "summary",
           "contactName!", "contactMobile!", "studentHeadName!", "facultyChairmanName!"),
    icon="FileText", theme="amber")

OD = _tpl(
    "od-attendance-notice", "OD Attendance Relief Notice", "Administration",
    "Request for on-duty attendance relief for students representing or organising an event.",
    "OD request for 12 students organising the SIH Internal Hackathon on 12 September.",
    _hdr() + """
<p><strong>To,</strong><br>{{submittedTo}}</p>
<p><strong>Subject:</strong> Request for On-Duty (OD) attendance relief for {{eventTitle}}</p>
<p>Respected Sir/Madam,</p>
<p>The following students of {{chapterName}} are engaged in {{dutyDescription}} for <strong>{{eventTitle}}</strong> on {{eventDate}} at {{venue}}. We request that they be granted OD attendance relief for the said period.</p>
<table><thead><tr><th>Sr. No.</th><th>Name</th><th>Roll No.</th><th>Branch</th><th>Role</th></tr></thead>
<tbody><tr><td>{{studentList}}</td></tr></tbody></table>""" + HEAD_CHAIR(),
    fields("refNo", "documentDate!", ("submittedTo!", {"defaultValue": "Head of Department", "example": "Head of Department"}),
           "chapterName!", "eventTitle!", "eventDate!", "venue!",
           field("dutyDescription", "Nature of duty", required=True, group="Event", example="organising and volunteering"),
           field("studentList", "Students", "table", required=True, official=True, group="Students", autoNumber=True,
                 columns=[{"key": "name", "label": "Name"}, {"key": "rollNo", "label": "Roll No."},
                          {"key": "branch", "label": "Branch"}, {"key": "role", "label": "Role"}],
                 example=[{"name": "Aarav Mehta", "rollNo": "U24CS045", "branch": "CSE", "role": "Volunteer"}]),
           "studentHeadName!", "facultyChairmanName!"),
    icon="FileText", theme="emerald")

MINUTES = _tpl(
    "meeting-minutes", "Meeting Minutes", "Administration",
    "Minutes of an executive or planning meeting: attendees, agenda, decisions and action items with owners.",
    "Minutes of the ACM executive meet on 14 Oct at Seminar Hall 402 covering SIH preparation.",
    """<h1 style="text-align: center">MINUTES OF MEETING</h1>""" + kv([
        ("Meeting", "{{meetingTitle}}"), ("Date", "{{meetingDate}}"), ("Time", "{{meetingTime}}"),
        ("Venue", "{{venue}}"), ("Chaired by", "{{chairedBy}}")]) + """
<h3>Attendees</h3><ul>{{attendees}}</ul>
<h3>Agenda</h3><ol>{{agendaItems}}</ol>
<h3>Discussion and decisions</h3><ul>{{decisions}}</ul>
<h3>Action items</h3>
<table><thead><tr><th>Sr. No.</th><th>Action</th><th>Owner</th><th>Deadline</th></tr></thead>
<tbody><tr><td>{{actionItems}}</td></tr></tbody></table>
<p>Next meeting: {{nextMeeting}}</p>
<p>Minutes recorded by: {{minutesBy}}</p>""" + HEAD_CHAIR(),
    fields(field("meetingTitle", "Meeting title", required=True, group="Meeting", example="ACM Executive Meet"),
           field("meetingDate", "Date", required=True, group="Meeting", example="14 October 2026"),
           field("meetingTime", "Time", required=True, group="Meeting", example="06:00 PM"),
           "venue!", field("chairedBy", "Chaired by", required=True, group="Meeting", example="Ansh Gupta"),
           field("attendees", "Attendees", "list", required=True, group="Meeting", example=["Ansh Gupta", "Arshad Khatib"]),
           field("agendaItems", "Agenda", "list", required=True, group="Meeting", example=["SIH preparation", "Budget review"]),
           field("decisions", "Discussion and decisions", "list", required=True, group="Meeting", example=["Finalise teams by 20 October"]),
           field("actionItems", "Action items", "table", group="Meeting", autoNumber=True,
                 columns=[{"key": "action", "label": "Action"}, {"key": "owner", "label": "Owner"}, {"key": "deadline", "label": "Deadline"}],
                 example=[{"action": "Book Seminar Hall", "owner": "Arshad Khatib", "deadline": "16 October"}]),
           field("nextMeeting", "Next meeting", group="Meeting", example="21 October 2026"),
           field("minutesBy", "Minutes recorded by", group="Meeting", example="Arshad Khatib"),
           "chapterName!", "studentHeadName!", "facultyChairmanName!"),
    icon="Calendar", theme="indigo")

APPRECIATION = _tpl(
    "certificate-of-appreciation", "Certificate of Appreciation", "Recognition",
    "Certificate for winners, volunteers, speakers and organisers, with recognition line and signatures.",
    "Certificate of appreciation for Aarav Mehta as winner of the SIH Internal Hackathon.",
    """<h1 style="text-align: center">CERTIFICATE OF APPRECIATION</h1>
<p style="text-align: center">is proudly presented to</p>
<h2 style="text-align: center">{{recipientName}}</h2>
<p style="text-align: center">in recognition of outstanding contribution as <strong>{{roleOrAchievement}}</strong> in <strong>{{eventTitle}}</strong> organized by {{chapterName}} on {{eventDate}}.</p>
<p style="text-align: center">Certificate ID: {{certificateId}}</p>""" + HEAD_CHAIR(),
    fields("recipientName!", field("roleOrAchievement", "Role or achievement", required=True, group="Recipient", example="Winner"),
           "eventTitle!", "chapterName!", "eventDate!", "certificateId", "studentHeadName!", "facultyChairmanName!"),
    icon="Award", theme="indigo")

SPONSOR = _tpl(
    "sponsorship-request", "Sponsorship Request", "Administration",
    "Letter to a company or alumni seeking sponsorship, with event reach and sponsor benefits.",
    "Request TechCorp to sponsor the SIH Internal Hackathon with Rs 25,000 for 1000+ participants.",
    _hdr() + """
<p><strong>To,</strong><br>{{sponsorContact}}<br>{{sponsorOrganization}}</p>
<p><strong>Subject:</strong> Request for sponsorship of {{eventTitle}}</p>
<p>Respected Sir/Madam,</p>
<p>{{chapterName}} is organizing <strong>{{eventTitle}}</strong> on {{eventDate}} at {{venue}}, expecting {{expectedAttendance}} participants. {{summary}}</p>
<p>We request your support of <strong>&#8377; {{sponsorshipAmount}}</strong>. In return we offer:</p>
<ul>{{sponsorBenefits}}</ul>
<p>For further discussion please contact {{contactName}} ({{contactMobile}}).</p>""" + HEAD_CHAIR(),
    fields("refNo", "documentDate!", "chapterName!",
           field("sponsorContact", "Addressee", required=True, group="Sponsor", example="The Head, University Relations"),
           field("sponsorOrganization", "Organization", required=True, group="Sponsor", example="TechCorp Pvt. Ltd."),
           "eventTitle!", "eventDate!", "venue!", "expectedAttendance!", "summary!",
           field("sponsorshipAmount", "Amount requested (₹)", "currency", required=True, official=True, group="Finance", example="25,000"),
           field("sponsorBenefits", "Sponsor benefits", "list", required=True, group="Finance",
                 example=["Logo on banners and certificates", "Recruitment talk slot", "Social media acknowledgement"]),
           "contactName!", "contactMobile!", "studentHeadName!", "facultyChairmanName!"),
    icon="FileText", theme="amber")

THANKS = _tpl(
    "thank-you-letter", "Thank You Letter", "Administration",
    "Appreciation letter to a guest, speaker, sponsor or volunteer after the event.",
    "Thank Dr. Meera Iyer for delivering the talk on Generative AI at our workshop on 14 October.",
    _hdr() + """
<p><strong>To,</strong><br>{{recipientName}}<br>{{recipientDesignation}}, {{recipientOrganization}}</p>
<p><strong>Subject:</strong> Thank you for your contribution to {{eventTitle}}</p>
<p>Respected {{recipientName}},</p>
<p>On behalf of {{chapterName}}, we sincerely thank you for {{contribution}} at <strong>{{eventTitle}}</strong> held on {{eventDate}}. Your support made the event a success, and we hope to welcome you again.</p>""" + HEAD_CHAIR(),
    fields("refNo", "documentDate!", "chapterName!", "recipientName!",
           field("recipientDesignation", "Designation", group="Recipient", example="Senior Research Scientist"),
           field("recipientOrganization", "Organization", group="Recipient", example="IIT Bombay"),
           "eventTitle!", "eventDate!",
           field("contribution", "Contribution", required=True, group="Event", example="delivering the session on Generative AI"),
           "studentHeadName!", "facultyChairmanName!"),
    icon="FileText", theme="emerald")

ATTENDANCE = _tpl(
    "attendance-sheet", "Attendance Sheet", "Reports",
    "Printable attendance sheet with event details; pre-fill names or leave blank rows to sign on paper.",
    "Attendance sheet for the web development workshop on 14 October in Seminar Hall.",
    """<h1 style="text-align: center">ATTENDANCE SHEET</h1>""" + kv([
        ("Event", "{{eventTitle}}"), ("Date", "{{eventDate}}"), ("Venue", "{{venue}}"), ("Session", "{{session}}")]) + f"""
<table><thead><tr><th>Sr. No.</th><th>Name</th><th>Roll No.</th><th>Branch</th><th>Signature</th></tr></thead>
<tbody><tr><td>{{{{attendeeRows}}}}</td></tr></tbody><tbody>{blank_rows(12, 5)}</tbody></table>""",
    fields("eventTitle!", "eventDate!", "venue!", field("session", "Session", group="Event", example="Day 1 – Morning"),
           field("attendeeRows", "Pre-filled attendees", "table", group="Attendees", autoNumber=True,
                 columns=[{"key": "name", "label": "Name"}, {"key": "rollNo", "label": "Roll No."},
                          {"key": "branch", "label": "Branch"}, {"key": "signature", "label": "Signature"}],
                 example=[{"name": "Aarav Mehta", "rollNo": "U24CS045", "branch": "CSE", "signature": ""}])),
    icon="FileSpreadsheet", theme="purple", wire="bill-table")

EXTRAS = [SUBMITTED, REPORT, SPEAKER, OD, MINUTES, APPRECIATION, SPONSOR, THANKS, ATTENDANCE]
