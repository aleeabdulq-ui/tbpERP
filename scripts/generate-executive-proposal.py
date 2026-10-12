"""Render the supplied proposal over the repository's existing letterhead.
Run: python -m pip install reportlab pypdf; python scripts/generate-executive-proposal.py
Requires DejaVu Sans fonts (Debian fonts-dejavu-core).
"""
from pathlib import Path
import re, io, copy, zipfile, xml.etree.ElementTree as ET
from xml.sax.saxutils import escape
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, NextPageTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/corporate'; OUT.mkdir(exist_ok=True)
for name,file in [('TBP','DejaVuSans.ttf'),('TBP-Bold','DejaVuSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'/usr/share/fonts/truetype/dejavu/'+file))
pdfmetrics.registerFontFamily('TBP',normal='TBP',bold='TBP-Bold',italic='TBP',boldItalic='TBP-Bold')
xml=ET.fromstring(zipfile.ZipFile(ROOT/'TBP ERP — Executive Business Proposal.docx').read('word/document.xml'))
raw='\n'.join(''.join(n.text or '' for n in x.findall('.//{*}t')) for x in xml.findall('.//{*}p'))
body=raw[raw.index('# 1. EXECUTIVE BUSINESS PROPOSAL'):raw.index('# DOCUMENT TWO')].strip()
body=body.replace('Final Agreed Enterprise Investment','Final Proposed Enterprise Investment')
body=body.replace('represents an agreed costing convention','represents a proposed costing convention')
body=body.replace('The initial role structure will support approximately sixteen operational role categories, with further configuration available where required.','The proposed role structure anticipates approximately sixteen operational role categories. The final role catalogue and permissions will be confirmed during requirements validation.')
body=body.replace('# 6. PROJECT COSTING AND PROFITABILITY ENGINE','# 6. MODULE 6: PROJECT COSTING AND PROFITABILITY ENGINE')
body=body.replace('## 7.1 Accounts and Finance','## 7.1 Module 7: Accounts and Finance').replace('## 7.2 Procurement and Inventory','## 7.2 Module 8: Procurement and Inventory').replace('## 7.3 Administration','## 7.3 Module 9: Administration').replace('## 7.4 Information Technology','## 7.4 Module 10: IT Service Management, Messaging and Enterprise Reporting').replace('## 7.5 Messaging and Reporting','## 7.5 Module 10 continued: Messaging and Reporting')
body=body.replace('These figures are illustrative, not a forecast of actual TBP project performance.','These figures are illustrative, not a forecast of actual TBP project performance. The stated estimated gross profit assumes that ₦15,700,000 represents forecast total project cost. If it represents only cost-to-date, remaining forecast costs must be included before calculating projected gross profit.')
body=body.replace('# ₦4,500,000.00','### ₦4,500,000.00').replace('# ₦675,000.00','### ₦675,000.00')
body+='''

# 18. EXECUTIVE INVESTMENT SUMMARY AND APPROVAL

| Item | Proposed Arrangement |
|---|---|
| Solution | Integrated TBP Enterprise Resource Planning System |
| Client | The Building Practice Limited |
| Addressee and primary coordinator | The Information Service Manager |
| Organisational coverage | Six departments; ten integrated modules |
| Standard proposed commercial valuation | ₦9,000,000 |
| Preferential Enterprise Partnership Concession | 50% (₦4,500,000) |
| Final proposed contract value | ₦4,500,000 |
| First instalment | ₦1,500,000 — execution and invoice / mobilisation |
| Second instalment | ₦1,500,000 — staging delivery and written UAT acceptance |
| Third instalment | ₦1,500,000 — production deployment, training and handover |
| Licence | Perpetual enterprise licence upon full payment |
| Per-employee / per-department licence fee | None for the licensed application |
| Target deployment | On or before 31 December 2026, subject to baselining |
| Complimentary warranty | 90 calendar days from production acceptance |
| Optional annual maintenance | ₦675,000; separately activated after warranty |
| Final approval authority | Authorised TBP executive management |

## 18.1 Matters requiring confirmation before execution

The proposed standard valuation is the provider's commercial reference, not an independently verified market valuation. The preferential enterprise partnership concession does not reduce the approved implementation scope, licence rights or warranty commitments.

Before execution, the parties shall confirm their legal identities and addresses; source-code access and third-party maintenance rights; the treatment of VAT and statutory deductions; invoice payment periods; hosting and third-party budgets; the verified development-status register; the implementation baseline; data migration responsibilities; and the precise maintenance coverage, service levels and recovery objectives.

A perpetual licence does not transfer intellectual property automatically and does not include perpetual free hosting, unlimited enhancements or indefinite technical support. The source-code arrangement must be expressly selected in the separate agreement. The proposed ₦675,000 annual fee must be supported by a sustainable, explicitly defined service scope.

## 18.2 Approval requested

Authorisation is requested to proceed with contract finalisation for the proposed TBP ERP implementation and perpetual enterprise licence at ₦4,500,000, and to release the first ₦1,500,000 instalment following execution and receipt of the corresponding invoice. Approval of this proposal does not replace the separate executed agreement or resolve its outstanding provisions.

| Approval record | Completion by authorised representatives |
|---|---|
| Decision | Approve subject to contract / Defer / Decline |
| Conditions | ________________________________________ |
| Information Service Manager | Name: _________________________________ |
| Coordination acknowledgment | Signature: __________________ Date: __________ |
| Executive approval | Name / title: _____________________________ |
| Authorised signature | Signature: __________________ Date: __________ |
| Finance confirmation | Name / signature: __________________________ |

The Information Service Manager's acknowledgment confirms project coordination and does not independently make the signatory a contracting party or confer executive approval authority.
'''
def number_words(n):
    small = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    if n < 20: return small[n]
    if n < 100: return tens[n // 10] + ('-' + small[n % 10] if n % 10 else '')
    if n < 1000: return small[n // 100] + ' Hundred' + (' and ' + number_words(n % 100) if n % 100 else '')
    for value, name in [(1000000000, 'Billion'), (1000000, 'Million'), (1000, 'Thousand')]:
        if n >= value:
            rest = n % value
            return number_words(n // value) + ' ' + name + ((' and ' if rest < 100 else ', ') + number_words(rest) if rest else '')

def money_words(text):
    pattern = re.compile(r'₦([0-9][0-9,]*(?:\.[0-9]{2})?)')
    def replace(m):
        parts = m.group(1).replace(',', '').split('.')
        naira = int(parts[0]); kobo = int(parts[1]) if len(parts) > 1 else 0
        words = number_words(naira) + ' Naira' + (' and ' + number_words(kobo) + ' Kobo' if kobo else '') + ' Only'
        suffix = ' (' + words + ')'
        figure = '₦' + format(naira, ',') + '.' + format(kobo, '02d')
        return figure if text[m.end():].startswith(suffix) else figure + suffix
    return pattern.sub(replace, text)

# Apply one consistent currency convention to the publication source and renderer.
body = re.sub(r'^\*\*(?:Nine Million Naira Only|Four Million, Five Hundred Thousand Naira Only|Six Hundred and Seventy-Five Thousand Naira Only)\*\*\s*$', '', body, flags=re.M)
body = body.replace('| First Installment |', '| Initial Commitment Fee |').replace('| First instalment |', '| Initial commitment fee |')
body = money_words(body)
(OUT/'source/01-executive.md').write_text('# TBP ERP — Executive Business Proposal\n\nAddressed to: The Information Service Manager, The Building Practice Limited\n\nVersion 1.3 | 12 October 2026 | Commercial proposal — subject to formal acceptance\n\n'+body)
NAVY=colors.HexColor('#172D43'); GREY=colors.HexColor('#526170')
styles={
'p':ParagraphStyle('Body',fontName='TBP',fontSize=8.3,leading=12,spaceAfter=5,textColor=colors.HexColor('#26323C')),
'h1':ParagraphStyle('H1',fontName='TBP-Bold',fontSize=12,leading=16,spaceBefore=15,spaceAfter=8,textColor=NAVY,keepWithNext=True),
'h2':ParagraphStyle('H2',fontName='TBP-Bold',fontSize=10,leading=14,spaceBefore=11,spaceAfter=6,textColor=NAVY,keepWithNext=True),
'h3':ParagraphStyle('H3',fontName='TBP-Bold',fontSize=9,leading=12,spaceBefore=8,spaceAfter=4,textColor=NAVY,keepWithNext=True),
'bullet':ParagraphStyle('Bullet',fontName='TBP',fontSize=8.3,leading=11.5,spaceAfter=2,leftIndent=10,firstLineIndent=-8,textColor=colors.HexColor('#26323C')),
'cell':ParagraphStyle('Cell',fontName='TBP',fontSize=7.8,leading=10.8,spaceAfter=1),
'cover':ParagraphStyle('Cover',fontName='TBP-Bold',fontSize=29,leading=36,textColor=NAVY,spaceAfter=14),
'sub':ParagraphStyle('Sub',fontName='TBP',fontSize=12,leading=18,textColor=GREY,spaceAfter=12),
}
def markup(s):
    s=escape(money_words(s))
    s=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'`([^`]+)`',r'\1',s)
    return s

def P(s,sty='p'): return Paragraph(markup(s),styles[sty])
def table(rows,widths=None):
    n=len(rows[0]); widths=widths or ([150,333] if n==2 else [483/n]*n)
    content=[[P(c,'cell') for c in row] for row in rows]
    t=Table(content,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#E6EDF3')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F7F9FB')]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),('LINEBELOW',(0,0),(-1,0),0.6,colors.HexColor('#AAB9C5')),('LINEBELOW',(0,1),(-1,-1),0.25,colors.HexColor('#DCE3E9'))]))
    return t
class Doc(BaseDocTemplate):
    def afterFlowable(self,f):
        if isinstance(f,Paragraph) and f.style.name=='H1':
            title=f.getPlainText(); key='s'+str(self.seq.nextf('heading'))
            self.canv.bookmarkPage(key); self.canv.addOutlineEntry(title,key,0,False)
            self.notify('TOCEntry',(0,title,self.page,key))
def footer(c,d):
    c.setFont('TBP',7);c.setFillColor(GREY)
    c.drawString(56,53,'CONFIDENTIAL  •  TBP-ERP/PROP/2026/001  •  v1.3')
    c.drawRightString(539,53,f'{d.page}')
    c.setStrokeColor(colors.HexColor('#CFD8E0'));c.line(56,65,539,65)
def interior_page(c,d):
    footer(c,d)
    c.saveState()
    c.setFont('TBP-Bold',7.2);c.setFillColor(NAVY)
    c.drawRightString(539,804,'TBP ERP  /  EXECUTIVE BUSINESS PROPOSAL')
    c.setFont('TBP',6.5);c.setFillColor(GREY)
    c.drawRightString(539,792,'THE BUILDING PRACTICE LIMITED')
    c.setStrokeColor(colors.HexColor('#CFD8E0'));c.setLineWidth(0.5)
    c.line(56,778,539,778)
    c.restoreState()
story=[NextPageTemplate('Interior'),Spacer(1,37),P('TBP ERP','cover'),P('Executive Business Proposal','sub'),P('Enterprise Resource Planning System','sub'),Spacer(1,15),P('**Comprehensive Software Documentation, Implementation Proposal & Commercial Investment Offer**'),Spacer(1,25),P('**ADDRESSED TO**'),P('The Information Service Manager\n'.strip()),P('**The Building Practice Limited**'),P('Lagos, Federal Republic of Nigeria'),Spacer(1,25),table([['Commercial offer','₦4,500,000.00'],['Initial commitment fee','₦1,500,000.00 — payable upon contract execution and invoice; forms part of the total contract value.'],['Licence arrangement','Perpetual enterprise software licence'],['Target production deployment','On or before 31 December 2026; subject to approved baseline'],['Proposal date / reference','12 October 2026 / TBP-ERP/PROP/2026/001'],['Status','Commercial proposal — subject to formal acceptance']]),Spacer(1,15),P('**CONFIDENTIAL BUSINESS PROPOSAL**'),Spacer(1,8),P('TBP ERP is proposed as a unified operational platform connecting six departments through ten integrated modules. The investment is intended to strengthen accountability, improve project-cost visibility and provide management with dependable information for timely decisions.'),P('The ₦4,500,000 offer combines the approved implementation scope with a perpetual enterprise licence, phased acceptance, staff training and a 90-day post-acceptance warranty. Optional annual maintenance is available separately at ₦675,000, subject to an agreed service scope.'),P('Prepared for confidential consideration by authorised TBP stakeholders and professional advisers. Commercial and implementation provisions remain subject to formal acceptance and the executed agreement.'),PageBreak(),P('Document control','h1'),table([['Control item','Record'],['Title','TBP ERP — Executive Business Proposal'],['Version / date','1.3 / 12 October 2026'],['Reference','TBP-ERP/PROP/2026/001'],['Client','The Building Practice Limited'],['Addressee','The Information Service Manager'],['Issuing letterhead','Moongale; legal contracting identity to be confirmed in the agreement'],['Status','Commercial proposal — subject to formal acceptance'],['Audience','Information Service Manager, executive management, directors and departmental heads'],['Source basis','Supplied executive proposal and matching repository DOCX; commercial figures and ten-module scope retained'],['Control note','Proposed terms require formal acceptance. This document is not the Master Software License Agreement.']]),Spacer(1,14),P('Purpose and submission','h2'),P('Submitted to the Information Service Manager for departmental review and executive consideration, this proposal presents TBP ERP as a structured enterprise investment with defined scope, phased payments, acceptance requirements and continuity provisions.'),P('Technical and legal terms require an approved specification, implementation plan and executed agreement. Deployment remains subject to technical assessment, timely mobilisation and client readiness.'),Spacer(1,10),P('Review priorities and approval pathway','h2'),P('Departmental reviewers should validate workflows, nominate record owners and approvers, and confirm migration and testing requirements. Finance and legal representatives should verify commercial, tax, licensing and support provisions before execution.'),P('The Information Service Manager is requested to consolidate departmental comments and coordinate their resolution with the provider. Authorised executive management may then consider the investment and approve contract finalisation. Mobilisation follows execution and the initial ₦1,500,000 commitment fee against invoice; subsequent payments remain linked to documented acceptance milestones.'),P('Expected organisational outcome','h2'),P('The intended result is a controlled enterprise platform that links employee activity, project delivery, procurement and financial reporting. Its value will depend on accurate records, consistent use, clearly delegated authority and successful verification of the agreed workflows—not software deployment alone.'),PageBreak(),P('Contents','h2')]
toc=TableOfContents();toc.levelStyles=[ParagraphStyle('TOC',fontName='TBP',fontSize=8.5,leading=12,spaceBefore=4,rightIndent=20)]
story.extend([toc,PageBreak()])
lines=body.splitlines();i=0
while i<len(lines):
    line=lines[i].strip();i+=1
    if not line or line=='---':continue
    if line.startswith('|'):
        rows=[ [x.strip() for x in line.strip('|').split('|')] ]
        while i<len(lines) and lines[i].strip().startswith('|'):
            row=[x.strip() for x in lines[i].strip().strip('|').split('|')];i+=1
            if all(re.fullmatch(r'[:\- ]+',x) for x in row):continue
            rows.append(row)
        story.extend([table(rows),Spacer(1,10)]);continue
    m=re.match(r'^(#{1,3})\s+(.*)',line)
    if m:
        level=len(m.group(1));title=m.group(2)
        if level==1 and title.startswith('18.'):story.append(PageBreak())
        story.append(P(title,'h'+str(level)));continue
    if line.startswith('- '):
        story.append(P('• '+line[2:],'bullet'));continue
    story.append(P(line))
buf=io.BytesIO();doc=Doc(buf,pagesize=(595.44,841.92),leftMargin=56,rightMargin=56.44,topMargin=88,bottomMargin=86,title='TBP ERP — Executive Business Proposal',author='Moongale',subject='Submitted to the Information Service Manager, The Building Practice Limited')
doc.addPageTemplates([
    PageTemplate(id='Cover',frames=[Frame(56,86,483,651.92,id='cover')],onPage=footer),
    PageTemplate(id='Interior',frames=[Frame(56,86,483,667.92,id='interior')],onPage=interior_page),
])
doc.multiBuild(story)
reader=PdfReader(buf);letter=PdfReader(ROOT/'moongale_llc_letterhead.pdf').pages[0]
# Cover uses the complete official letterhead, unaltered. Interior pages reuse
# only its original footer and a clipped, smaller vector logo (not a new brand).
footer_art=copy.deepcopy(letter)
footer_art.cropbox=RectangleObject((0,0,595.44,45))
small_logo=copy.deepcopy(letter)
small_logo.cropbox=RectangleObject((45,773,285,825))
for index,page in enumerate(reader.pages):
    if index==0:
        page.merge_page(letter,over=False)
    else:
        page.merge_page(footer_art,over=False)
        page.merge_transformed_page(small_logo,Transformation().scale(0.62).translate(21.28,302),over=False)
writer=PdfWriter();writer.append(reader)
writer.add_metadata({'/Title':'TBP ERP — Executive Business Proposal','/Author':'Moongale','/Subject':'The Information Service Manager — The Building Practice Limited','/Keywords':'TBP ERP, executive proposal, ₦4,500,000'})
file=OUT/'TBP ERP — Executive Business Proposal.pdf'
with file.open('wb') as f:writer.write(f)
print(f'{file}\nPages: {len(reader.pages)}')
