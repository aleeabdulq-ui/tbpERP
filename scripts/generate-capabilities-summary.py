"""Generate the separate, two-page TBP ERP capabilities and benefits summary.
Dependencies: reportlab, pypdf; system fonts: DejaVu Sans.
"""
from pathlib import Path
import copy
import io
import re
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter, Transformation
from pypdf.generic import RectangleObject

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/corporate'
for name, file in [('TBP', 'DejaVuSans.ttf'), ('TBP-Bold', 'DejaVuSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, '/usr/share/fonts/truetype/dejavu/' + file))
pdfmetrics.registerFontFamily('TBP', normal='TBP', bold='TBP-Bold')
navy = colors.HexColor('#172D43')
grey = colors.HexColor('#526170')
styles = {
    'body': ParagraphStyle('Body', fontName='TBP', fontSize=8.5, leading=12, spaceAfter=7, textColor=navy),
    'h1': ParagraphStyle('Heading', fontName='TBP-Bold', fontSize=17, leading=22, spaceAfter=12, textColor=navy, keepWithNext=True),
    'h2': ParagraphStyle('Subheading', fontName='TBP-Bold', fontSize=10, leading=14, spaceBefore=8, spaceAfter=6, textColor=navy, keepWithNext=True),
    'cell': ParagraphStyle('Cell', fontName='TBP', fontSize=8, leading=11, textColor=navy),
    'bullet': ParagraphStyle('Bullet', fontName='TBP', fontSize=8.5, leading=12, spaceAfter=6, leftIndent=9, firstLineIndent=-9, textColor=navy),
}

def para(text, style='body'):
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', escape(text))
    return Paragraph(text, styles[style])

def table(rows):
    t = Table([[para(c, 'cell') for c in row] for row in rows], colWidths=[136, 347], repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E6EDF3')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F7F9FB')]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -1), .25, colors.HexColor('#DCE3E9')),
    ]))
    return t

def furniture(c, d):
    c.setFillColor(grey); c.setFont('TBP', 6.5)
    c.drawString(56, 53, 'CONFIDENTIAL  •  TBP-ERP/SUM/2026/001  •  v1.0  •  20 October 2026')
    c.drawRightString(539, 53, f'{d.page} / 2')
    c.setStrokeColor(colors.HexColor('#CFD8E0')); c.setLineWidth(.5); c.line(56, 65, 539, 65)
    if d.page > 1:
        c.setFillColor(navy); c.setFont('TBP-Bold', 7.2)
        c.drawRightString(539, 804, 'TBP ERP  /  CAPABILITIES & BENEFITS')
        c.setFillColor(grey); c.setFont('TBP', 6.5)
        c.drawRightString(539, 792, 'THE BUILDING PRACTICE LIMITED')
        c.line(56, 778, 539, 778)

source = (OUT / 'source/02-capabilities-benefits-summary.md').read_text()
lines = source.splitlines()
story = []
i = 0
headings = 0
while i < len(lines):
    line = lines[i].strip(); i += 1
    if not line:
        continue
    if line.startswith('# '):
        if headings:
            story.append(PageBreak())
        headings += 1
        story.append(para(line[2:], 'h1'))
    elif line.startswith('## '):
        story.append(para(line[3:], 'h2'))
    elif line.startswith('|'):
        rows = [[c.strip() for c in line.strip('|').split('|')]]
        while i < len(lines) and lines[i].startswith('|'):
            row = [c.strip() for c in lines[i].strip('|').split('|')]; i += 1
            if not all(re.fullmatch(r'[-: ]+', c) for c in row):
                rows.append(row)
        story.extend([table(rows), Spacer(1, 9)])
    elif line.startswith('- '):
        story.append(para('• ' + line[2:], 'bullet'))
    else:
        story.append(para(line))

buf = io.BytesIO()
doc = SimpleDocTemplate(buf, pagesize=(595.44, 841.92), leftMargin=56, rightMargin=56.44,
                        topMargin=100, bottomMargin=86, title='TBP ERP — Capabilities and Benefits Summary', author='Moongale')
doc.build(story, onFirstPage=furniture, onLaterPages=furniture)
reader = PdfReader(buf)
assert len(reader.pages) == 2, f'Summary must fit two pages; got {len(reader.pages)}'
letter = PdfReader(ROOT / 'moongale_llc_letterhead.pdf').pages[0]
footer = copy.deepcopy(letter); footer.cropbox = RectangleObject((0, 0, 595.44, 45))
logo = copy.deepcopy(letter); logo.cropbox = RectangleObject((45, 773, 285, 825))
reader.pages[0].merge_page(letter, over=False)
reader.pages[1].merge_page(footer, over=False)
reader.pages[1].merge_transformed_page(logo, Transformation().scale(.62).translate(21.28, 302), over=False)
writer = PdfWriter(); writer.append(reader)
writer.add_metadata({'/Title': 'TBP ERP — Capabilities and Benefits Summary', '/Author': 'Moongale', '/Subject': 'What TBP ERP will do, business benefits and delivery approach'})
output = OUT / 'TBP ERP — Capabilities and Benefits Summary.pdf'
with output.open('wb') as f:
    writer.write(f)
print(f'{output}\nPages: 2')
