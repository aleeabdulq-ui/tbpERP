"""Render the supplied proposal over the repository's existing letterhead.
Run: python -m pip install reportlab pypdf; python scripts/generate-executive-proposal.py
Requires DejaVu Sans fonts (Debian fonts-dejavu-core).
"""
from pathlib import Path
import re, io, copy
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
body=(OUT/'source/01-executive.md').read_text()
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

body = money_words(body)
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
    c.drawString(56,53,'CONFIDENTIAL  •  TBP-ERP/PROP/2026/001  •  v2.0')
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
story=[NextPageTemplate('Interior'),Spacer(1,37),P('TBP ERP','cover'),P('Executive Business Proposal','sub'),P('Budget and Implementation Offer','sub'),Spacer(1,22),P('**ADDRESSED TO**'),P('The Information Service Manager'),P('**The Building Practice Limited**'),P('Lagos, Federal Republic of Nigeria'),Spacer(1,25),table([
['Commercial offer','₦4,500,000.00'],
['Initial commitment fee','₦1,500,000.00 — part of the total, payable on execution and invoice.'],
['Final payment timing','Before production deployment and commencement of training, following written readiness confirmation.'],
['Licence','Perpetual enterprise licence; source-code rights to be agreed.'],
['Target deployment','On or before 31 December 2026, subject to an approved feasible baseline.'],
['Proposal reference','TBP-ERP/PROP/2026/001'],
['Revision / date','Version 2.0 / 20 October 2026'],
]),Spacer(1,16),P('**CONFIDENTIAL BUSINESS PROPOSAL**'),P('An integrated platform for ten agreed modules across six departments, intended to support accountability, coordinated workflows and management reporting. This offer is subject to requirements validation and a formal written agreement.'),P('Financial inputs and calculation rules must be supplied or approved by TBP’s Accounts department. This proposal does not assume access to TBP’s internal salary, costing or financial policies.'),PageBreak(),P('Document control','h1'),table([
['Control item','Record'],['Version / status','2.0 / Budget proposal — subject to contract'],['Revision date','20 October 2026; original proposal dated 12 October 2026'],['Client / addressee','The Building Practice Limited / Information Service Manager'],['Issuing letterhead','Moongale; full contracting identity to be confirmed before execution'],['Revision purpose','Concise business scope; no technology names or internal calculation assumptions; final payment before deployment and training.'],
]),Spacer(1,12),P('Purpose and submission','h2'),P('Submitted for departmental review and executive budget consideration. TBP will provide its internal policies and authorised data; the provider will implement the approved requirements and demonstrate conformity through testing. Commercial and legal terms require a separate executed agreement.'),P('Review priority','h2'),P('Confirm scope, Accounts-approved rules, staged payment terms, source-code rights, delivery feasibility and post-payment delivery protections before contract execution.'),Spacer(1,10),P('Contents','h2')]
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
        if level==1 and title.startswith(('2.', '3.', '4.', '5.', '6.', '7.', '8.')):story.append(PageBreak())
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
