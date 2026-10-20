"""The five priority forms, modelled on the club's real submitted PDFs."""
from .common import blank_rows, field, fields, kv, person, person_specs, sig_block

# ---------------------------------------------------------------- 1. Event Proposal
_proposal_html = f"""
<table><tbody><tr><td>No : {{{{refNo}}}}</td><td style="text-align: right">Date : {{{{documentDate}}}}</td></tr></tbody></table>
<p><strong>Submitted to {{{{submittedTo}}}}:</strong></p>
<p><strong>Subject :</strong> Requesting Permission to Conduct {{{{eventTitle}}}}</p>
{kv([
  ("Chapter/Club/Society/Section Name", "{{chapterName}}"),
  ("Chapter/Club/Society/Section Code No", "{{chapterCode}}"),
  ("Schedule of Event (Date, Day)", "{{eventDate}}"),
  ("Event Venue", "{{venue}}"),
])}
<h2 style="text-align: center">About the Event</h2>
{kv([
  ("Title of the Event", "{{eventTitle}}"),
  ("Category of the Event", "{{eventCategory}}"),
  ("Brief Description", "{{summary}}"),
  ("Objectives", "{{objectives}}"),
  ("Target Audience", "{{targetAudience}}"),
  ("Expected Number of Participants", "{{expectedAttendance}}"),
  ("Name of Judges", "{{judges}}"),
])}
<h2 style="text-align: center">Financial Proposal</h2>
<table>
<thead><tr><th>Sr. No.</th><th>Items</th><th>Approximate Amount (Rs)</th></tr></thead>
<tbody><tr><td>{{{{expenseItems}}}}</td></tr></tbody>
<tbody><tr><td></td><td><strong>Total</strong></td><td><strong>{{{{budgetTotal}}}}</strong></td></tr></tbody>
</table>
<hr class="page-break">
{sig_block([
  person("Signature of Student Head", "studentHead"),
  person("Signature of Student Secretary", "studentSecretary"),
  person("Signature of Faculty Co-Chairman", "facultyCoChairman", lines=("Designation", "Dept", "Mobile")),
  person("Signature of Faculty Chairman", "facultyChairman", lines=("Designation", "Dept", "Mobile")),
])}
<h2 style="text-align: center">Office Use</h2>
{kv([
  ("Total amount sanctioned in current academic year", "&nbsp;"),
  ("Amount utilized", "&nbsp;"),
  ("Current proposed amount", "&nbsp;"),
  ("Balance amount", "&nbsp;"),
  ("Signature (Office Clerk)", "&nbsp;"),
])}
{sig_block([
  "Recommended / Not Recommended<br><br><br>{{fswChairmanName}}<br>Chairman, F&amp; SW",
  "Recommended / Not Recommended<br><br><br>{{assocDeanName}}<br>Associate Dean (SW)",
  "Approved / Not Approved<br><br><br>{{deanName}}<br>Dean (Students Welfare)",
])}
"""

EVENT_PROPOSAL = {
    "key": "event-proposal", "title": "Event Proposal", "templateType": "Event Proposal",
    "category": "Permission Docs", "iconName": "FileText", "theme": "blue",
    "previewHeading": "EVENT PROPOSAL", "wireframeVariant": "proposal-table", "catalogVersion": 1,
    "description": "Dean (Students Welfare) approval form: event details, objectives, financial proposal, signatures and office-use block.",
    "suggestedPrompt": "Internal hackathon on 12 September in the CSE Department for 1000+ students; banner Rs 800 and miscellaneous Rs 300.",
    "html": _proposal_html,
    "fields": fields(
        "refNo!", "documentDate!", "submittedTo!", "chapterName!", "chapterCode!",
        "eventTitle!", "eventCategory!", "eventDate!", "venue!", "summary!", "objectives!",
        "targetAudience!", "expectedAttendance!", "judges",
        field("expenseItems", "Expense items", "table", required=True, official=True, group="Finance", autoNumber=True,
              columns=[{"key": "item", "label": "Items"}, {"key": "amount", "label": "Approximate Amount (Rs)"}],
              example=[{"item": "Banner (8*6)", "amount": "800"}, {"item": "Miscellaneous", "amount": "300"}]),
        "budgetTotal!",
        *person_specs("studentHead", skip=("Designation",)), *person_specs("studentSecretary"),
        *person_specs("facultyCoChairman"), *person_specs("facultyChairman"),
        "fswChairmanName", "assocDeanName", "deanName",
    ),
}

# ---------------------------------------------------------------- 2. Permission Letter
_perm_html = f"""
<table><tbody><tr><td>REF NO.: {{{{refNo}}}}</td><td style="text-align: right">DATE: {{{{documentDate}}}}</td></tr></tbody></table>
<p><strong>SUBMITTED TO:</strong> {{{{submittedTo}}}}</p>
<p><strong>SUBJECT:</strong> Requesting Permission to Conduct {{{{eventTitle}}}} in {{{{venue}}}}.</p>
<p><strong>SCHEDULE OF EVENT:</strong> {{{{eventDate}}}}, {{{{eventTime}}}}</p>
<h2 style="text-align: center">ABOUT THE EVENT</h2>
{kv([
  ("Brief Description", "{{summary}}"),
  ("Objective", "{{objectives}}"),
  ("Number of Participants", "{{expectedAttendance}}"),
  ("Mode", "{{mode}}"),
  ("Event Organizers", "{{organizer}}"),
])}
<p>We request permission to use {{{{venue}}}} on {{{{eventDate}}}} from {{{{eventTime}}}} for conducting the {{{{eventTitle}}}}.</p>
{sig_block([
  person("", "studentHead", lines=("RollNo", "Branch", "Mobile"), desig=True).replace("<strong></strong><br><br><br>", ""),
  "Name: {{venueStaffName}}<br>Designation: {{venueStaffDesignation}}<br>Mobile No.: {{venueStaffMobile}}",
  "Name: {{venueFacultyName}}<br>Designation: {{venueFacultyDesignation}}",
  "Name: {{facultyChairmanName}}<br>Designation: {{facultyChairmanDesignation}}<br>Dept: {{facultyChairmanDept}}",
])}
"""

PERMISSION_LETTER = {
    "key": "permission-letter", "title": "Permission Letter", "templateType": "Permission Letter",
    "category": "Permission Docs", "iconName": "FileText", "theme": "amber",
    "previewHeading": "PERMISSION LETTER", "wireframeVariant": "letter", "catalogVersion": 1,
    "description": "Formal request to the HoD / faculty for venue booking, with event summary, objective and venue-staff sign-off.",
    "suggestedPrompt": "Permission letter requesting Seminar Hall 402 on 14 Oct from 6:00 PM to 7:30 PM for the ACM Executives Meet, 150+ participants.",
    "html": _perm_html,
    "fields": fields(
        "refNo!", "documentDate!",
        ("submittedTo!", {"defaultValue": "HoD (CSE Dept.)", "example": "HoD (CSE Dept.)"}),
        "eventTitle!", "venue!", "eventDate!", "eventTime!", "summary!", "objectives!",
        "expectedAttendance!", "mode!", "organizer!",
        "studentHeadName!", "studentHeadDesignation!", "studentHeadRollNo!", "studentHeadBranch!", "studentHeadMobile",
        field("venueStaffName", "Venue tech assistant name", official=True, group="Venue", example="Sunny Bodiwala"),
        field("venueStaffDesignation", "Venue tech assistant designation", official=True, group="Venue", example="Tech Assistant, Seminar Hall"),
        field("venueStaffMobile", "Venue tech assistant mobile", official=True, group="Venue"),
        field("venueFacultyName", "Venue faculty in-charge", official=True, group="Venue", example="Shri. Rakesh P. Gohil"),
        field("venueFacultyDesignation", "Venue faculty designation", official=True, group="Venue", example="Faculty in-charge, Seminar Hall"),
        "facultyChairmanName!", "facultyChairmanDesignation!", "facultyChairmanDept!",
    ),
}

# ---------------------------------------------------------------- 3. Bill Summary
_bill_summary_html = f"""
<table><tbody><tr><td></td><td style="text-align: right">Date: {{{{documentDate}}}}</td></tr></tbody></table>
<h1 style="text-align: center">BILL SUMMARY</h1>
<p style="text-align: center">Reimbursement for Cost incurred in {{{{eventTitle}}}}</p>
<table>
<thead><tr><th>Sr. No.</th><th>Name</th><th>Account Details</th><th>To Be Paid to</th><th>Amount (INR)</th></tr></thead>
<tbody><tr><td>{{{{payeeRows}}}}</td></tr></tbody>
<tbody><tr><td></td><td></td><td></td><td><strong>Grand Total</strong></td><td><strong>{{{{grandTotal}}}}</strong></td></tr></tbody>
</table>
{sig_block([
  "<strong>Student Head</strong><br><br><br>{{studentHeadName}}<br><br>{{chapterName}}",
  "<strong>Student Secretary</strong><br><br><br>{{studentSecretaryName}}<br><br>{{chapterName}}",
  "<strong>Faculty Chairman</strong><br><br><br>{{facultyChairmanName}}<br><br>{{chapterName}}",
])}
<hr class="page-break">
<h2 style="text-align: center">Other Bank Account Details</h2>
<table>
<thead><tr><th>Sr. No.</th><th>Name</th><th>Account No.</th><th>IFSC Code</th><th>Amount</th></tr></thead>
<tbody><tr><td>{{{{bankRows}}}}</td></tr></tbody>
<tbody><tr><td></td><td></td><td></td><td><strong>Total:</strong></td><td><strong>{{{{bankTotal}}}}</strong></td></tr></tbody>
</table>
{sig_block(["<strong>Faculty Chairman</strong><br><br><br>{{facultyChairmanName}}<br><br>{{chapterName}}"])}
"""

BILL_SUMMARY = {
    "key": "bill-summary", "title": "Bill Summary", "templateType": "Bill Summary",
    "category": "Bill Summary", "iconName": "FileSpreadsheet", "theme": "purple",
    "previewHeading": "BILL SUMMARY", "wireframeVariant": "bill-table", "catalogVersion": 1,
    "description": "Reimbursement summary for event costs: payee table, grand total, other-bank account details and sign-off.",
    "suggestedPrompt": "Bill summary for SIH Internal Hackathon: prize money Rs 5,000 to two winners paid to other bank accounts.",
    "html": _bill_summary_html,
    "fields": fields(
        "documentDate!", "eventTitle!", "chapterName!",
        field("payeeRows", "Payees", "table", required=True, official=True, group="Finance", autoNumber=True,
              columns=[{"key": "name", "label": "Name"}, {"key": "accountDetails", "label": "Account Details"},
                       {"key": "paidTo", "label": "To Be Paid to"}, {"key": "amount", "label": "Amount (INR)"}],
              example=[{"name": "Aarav Mehta", "accountDetails": "Other", "paidTo": "Winner (1st)", "amount": "3000"},
                       {"name": "Diya Shah", "accountDetails": "Other", "paidTo": "Winner (2nd)", "amount": "2000"}]),
        field("grandTotal", "Grand total (₹)", "currency", required=True, official=True, group="Finance", example="5000"),
        field("bankRows", "Other bank account details", "table", official=True, group="Finance", autoNumber=True,
              columns=[{"key": "name", "label": "Name"}, {"key": "accountNo", "label": "Account No."},
                       {"key": "ifsc", "label": "IFSC Code"}, {"key": "amount", "label": "Amount"}],
              example=[{"name": "Aarav Mehta", "accountNo": "XXXXXXXX1234", "ifsc": "SBIN0000001", "amount": "3000"}]),
        field("bankTotal", "Bank details total (₹)", "currency", official=True, group="Finance", example="3000"),
        "studentHeadName!", "studentSecretaryName!", "facultyChairmanName!",
    ),
}

# ---------------------------------------------------------------- 4. Bill Certificate (Form BC-R)
_bc_html = f"""
<h1 style="text-align: center">BILL CERTIFICATE</h1>
<p style="text-align: center"><strong>(RECURRING EXPENDITURE)</strong> &mdash; Form BC-R</p>
{kv([
  ("Chapter Name", "{{chapterName}}"),
  ("Code No.", "{{chapterCode}}"),
  ("Approval Note No.", "{{refNo}}"),
  ("Date", "{{documentDate}}"),
  ("Original Approval Note / Comparative Statement attached herewith / sent with bill No. dtd.", "{{billNo}} dtd. {{billDate}}"),
  ("For Rs. / of M/s.", "{{billAmount}} / {{supplierName}}"),
  ("Purchase Order No. and date", "{{purchaseOrder}}"),
  ("Head of Account (Code No.)", "{{headOfAccount}}"),
  ("Advance drawn in Rs. (if any)", "{{advanceDrawn}}"),
])}
<p>&ldquo;I, {{{{certifierName}}}}, am personally satisfied that the goods (described below) purchased are of the requisite quality and specification and have been purchased from a reliable supplier / contractor at a reasonable price.&rdquo;</p>
<table>
<thead><tr><th>Sr. No.</th><th>Name of the Equipment / item(s)</th><th>Quantity</th><th>Unit Cost (Rs.)</th><th>Total Cost of Item(s) (Rs.)</th></tr></thead>
<tbody><tr><td>{{{{billItems}}}}</td></tr></tbody>
<tbody>
<tr><td></td><td></td><td></td><td>Total Amount (Rs.)</td><td>{{{{itemsTotal}}}}</td></tr>
<tr><td></td><td></td><td></td><td>+ Taxes or other charges</td><td>{{{{taxes}}}}</td></tr>
<tr><td></td><td></td><td></td><td><strong>Total Estimated Amount Including Taxes (Rs.)</strong></td><td><strong>{{{{totalWithTax}}}}</strong></td></tr>
</tbody>
</table>
<h3 style="text-align: center">SUPPLIER DETAILS</h3>
{kv([
  ("Name of the Supplier", "{{supplierName}}"),
  ("GST No.", "{{supplierGst}}"),
  ("Any other Taxes", "{{otherTaxes}}"),
  ("Invoice No. and date", "{{invoiceNo}} and {{invoiceDate}}"),
  ("Amount (Rs.)", "{{billAmount}}"),
])}
<h3 style="text-align: center">PAYMENT DETAILS</h3>
{kv([
  ("Name of the Party", "{{partyName}}"),
  ("Account Number", "{{accountNo}}"),
  ("Account Holder Name", "{{accountHolderName}}"),
  ("Name of the Bank", "{{bankName}}"),
  ("Name of the Branch", "{{bankBranch}}"),
  ("IFSC Code", "{{ifsc}}"),
])}
<hr class="page-break">
<h3 style="text-align: center">STOCK ENTRY DETAILS</h3>
{kv([
  ("Name of the Laboratory / Office", "Student Council"),
  ("Register (Recurring / Consumable / Miscellaneous) and Name / Type", "&nbsp;"),
  ("Serial Number / Page Number", "&nbsp;"),
  ("Date", "&nbsp;"),
  ("Name and Signature of a Clerk / Staff", "&nbsp;"),
])}
<h3 style="text-align: center">INDENTER DETAILS</h3>
{kv([
  ("Name of the Faculty Chairman / Co-Chairman", "{{facultyChairmanName}}"),
  ("Designation", "{{indenterDesignation}}"),
  ("Department", "{{facultyChairmanDept}}"),
  ("Signature with Date", "&nbsp;"),
])}
<h3 style="text-align: center">Recommendation (Head of the Department)</h3>
{kv([("Recommended Amount", "&nbsp;"), ("Approved and Recommended for Bill Payment", "&nbsp;"), ("Date / Dean Student Welfare", "&nbsp;")])}
<h3 style="text-align: center">(FOR USE IN ACCOUNT SECTION)</h3>
{kv([
  ("Head of Account", "&nbsp;"), ("Budget Code No.", "&nbsp;"),
  ("Mode of Payment (Cash / Cheque / Online / Adjusted Against Advance)", "&nbsp;"),
  ("Details of Mode of Payment", "&nbsp;"), ("Voucher No. and Date", "&nbsp;"),
  ("Passed for payment / adjustment of Amount in (Rs.) figures and words", "&nbsp;"),
])}
{sig_block(["Office Supt.", "Dy. Registrar (A/cs.)", "Registrar / Director"])}
"""

BILL_CERTIFICATE = {
    "key": "bill-certificate", "title": "Bill Certificate", "templateType": "Bill Certificate",
    "category": "Bill Certificate", "iconName": "FileSpreadsheet", "theme": "amber",
    "previewHeading": "BILL CERTIFICATE", "wireframeVariant": "bill-table", "catalogVersion": 1,
    "description": "Institute Form BC-R (recurring expenditure) for reimbursement: items, supplier, payment details, stock entry and account sign-offs.",
    "suggestedPrompt": "Bill certificate for 2 banners bought from Sai Printers, invoice 1059 dated 08/09/2026, total Rs 1,100 including GST.",
    "html": _bc_html,
    "fields": fields(
        "chapterName!", "chapterCode!", "refNo!", "documentDate!",
        field("billNo", "Original bill no.", required=True, official=True, group="Bill", example="1059"),
        field("billDate", "Bill date", "date", required=True, group="Bill", example="08/09/2026"),
        field("billAmount", "Bill amount (₹)", "currency", required=True, official=True, group="Bill", example="1100"),
        field("supplierName", "Supplier (M/s.)", required=True, official=True, group="Supplier", example="Sai Printers"),
        field("purchaseOrder", "Purchase order no. and date", group="Bill", defaultValue="NIL", example="NIL"),
        field("headOfAccount", "Head of account (code no.)", official=True, group="Bill", example="6/52"),
        field("advanceDrawn", "Advance drawn (₹)", group="Bill", defaultValue="NIL", example="NIL"),
        field("certifierName", "Certifying person (the 'I, ...' line)", required=True, official=True, group="Bill", example="Dr. Sankita J. Patel"),
        field("billItems", "Items", "table", required=True, official=True, group="Bill", autoNumber=True,
              columns=[{"key": "item", "label": "Name of the Equipment / item(s)"}, {"key": "quantity", "label": "Quantity"},
                       {"key": "unitCost", "label": "Unit Cost (Rs.)"}, {"key": "totalCost", "label": "Total Cost (Rs.)"}],
              example=[{"item": "Banner (8*6)", "quantity": "1", "unitCost": "800", "totalCost": "800"},
                       {"item": "Miscellaneous", "quantity": "1", "unitCost": "300", "totalCost": "300"}]),
        field("itemsTotal", "Total amount (₹)", "currency", required=True, official=True, group="Bill", example="1100"),
        field("taxes", "Taxes or other charges (₹)", "currency", official=True, group="Bill", defaultValue="0", example="0"),
        field("totalWithTax", "Total including taxes (₹)", "currency", required=True, official=True, group="Bill", example="1100"),
        field("supplierGst", "Supplier GST no.", official=True, group="Supplier", example="24ABCDE1234F1Z5"),
        field("otherTaxes", "Any other taxes", group="Supplier", defaultValue="-", example="-"),
        field("invoiceNo", "Invoice no.", required=True, official=True, group="Supplier", example="1059"),
        field("invoiceDate", "Invoice date", "date", required=True, group="Supplier", example="08/09/2026"),
        field("partyName", "Name of the party", required=True, official=True, group="Payment", example="Sai Printers"),
        field("accountNo", "Account number", required=True, official=True, group="Payment", example="XXXXXXXX1234"),
        field("accountHolderName", "Account holder name", required=True, official=True, group="Payment", example="Sai Printers"),
        field("bankName", "Name of the bank", required=True, official=True, group="Payment", example="State Bank of India"),
        field("bankBranch", "Name of the branch", required=True, official=True, group="Payment", example="Athwa Lines, Surat"),
        field("ifsc", "IFSC code", required=True, official=True, group="Payment", example="SBIN0000001"),
        "facultyChairmanName!", "facultyChairmanDept!",
        field("indenterDesignation", "Indenter designation", official=True, group="Signatories",
              defaultValue="Assistant Professor", example="Assistant Professor"),
    ),
}

# ---------------------------------------------------------------- 5. Prize Money Receipt
_prize_html = f"""
<table><tbody><tr><td>Sr. No. {{{{srNo}}}}</td><td style="text-align: right">Date: {{{{documentDate}}}}</td></tr></tbody></table>
<h1 style="text-align: center">Prize Money Receipt</h1>
<p>It is hereby acknowledged that an amount of &#8377; {{{{amount}}}} will be received by me for securing {{{{position}}}} Position in the competition/event named {{{{eventTitle}}}} organized by {{{{chapterName}}}}, held on {{{{eventDate}}}} at {{{{venue}}}}.</p>
<h3>(Account Detail)</h3>
{kv([
  ("Affiliating Institute", "Sardar Vallabhbhai National Institute of Technology, Surat (SVNIT)"),
  ("Name as per Bank Account", "{{accountHolderName}}"),
  ("Bank Name", "{{bankName}}"),
  ("Branch", "{{bankBranch}}"),
  ("Account No.", "{{accountNo}}"),
  ("IFSC Code", "{{ifsc}}"),
  ("Pan Card No.", "{{panNo}}"),
])}
<h3>Student Details</h3>
{kv([
  ("Name", "{{recipientName}}"),
  ("Roll No.", "{{recipientRollNo}}"),
  ("Course &amp; Semester", "{{recipientCourse}}"),
  ("Mobile No.", "{{recipientMobile}}"),
])}
<p><strong>Signature:</strong></p>
<p><br></p>
<p>It is certified that the said amount is recommended for payment.</p>
<p><br><br></p>
<p><strong>Chairman Signature</strong><br>{{{{facultyChairmanName}}}}</p>
"""

PRIZE_MONEY = {
    "key": "prize-money", "title": "Prize Money Receipt", "templateType": "Prize Money Receipt",
    "category": "Prize Money", "iconName": "Award", "theme": "rose",
    "previewHeading": "PRIZE MONEY RECEIPT", "wireframeVariant": "letter", "catalogVersion": 1,
    "description": "Receipt a prize winner signs to acknowledge prize money, with bank and student details and the chairman's recommendation.",
    "suggestedPrompt": "Prize money receipt of Rs 3,000 for first position in the SIH Internal Hackathon held on 12 September 2026.",
    "html": _prize_html,
    "fields": fields(
        field("srNo", "Receipt sr. no.", official=True, group="Document", example="PM/001"),
        "documentDate!",
        field("amount", "Prize amount (₹)", "currency", required=True, official=True, group="Prize", example="3,000"),
        field("position", "Position secured", required=True, group="Prize", example="First"),
        "eventTitle!", "chapterName!", "eventDate!", "venue!",
        field("accountHolderName", "Name as per bank account", required=True, official=True, group="Bank", example="Aarav Mehta"),
        field("bankName", "Bank name", required=True, official=True, group="Bank", example="State Bank of India"),
        field("bankBranch", "Branch", required=True, official=True, group="Bank", example="SVNIT Campus, Surat"),
        field("accountNo", "Account no.", required=True, official=True, group="Bank", example="XXXXXXXX1234"),
        field("ifsc", "IFSC code", required=True, official=True, group="Bank", example="SBIN0000001"),
        field("panNo", "PAN card no.", official=True, group="Bank", example="ABCDE1234F"),
        "recipientName!", "recipientRollNo!",
        field("recipientCourse", "Course & semester", required=True, group="Recipient", example="B.Tech CSE, Sem 5"),
        field("recipientMobile", "Recipient mobile no.", official=True, group="Recipient", example="+91 90000 00000"),
        "facultyChairmanName!",
    ),
}

PRIORITY = [EVENT_PROPOSAL, PERMISSION_LETTER, BILL_SUMMARY, BILL_CERTIFICATE, PRIZE_MONEY]
