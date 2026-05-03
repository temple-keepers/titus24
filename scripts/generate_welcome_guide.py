"""
Generates the Titus 2:4 Welcome Guide as a styled PDF.

Run: python scripts/generate_welcome_guide.py
Output: Titus24_Welcome_Guide.pdf in the project root.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
    PageBreak, KeepTogether, Flowable, Table, TableStyle,
)
from reportlab.pdfgen.canvas import Canvas

# ── Brand palette ──────────────────────────────────────────────────────────
ROSE       = HexColor('#E8668A')
PINK       = HexColor('#F78DA7')
PINK_WASH  = HexColor('#FCE7EE')
PINK_FAINT = HexColor('#FDF3F6')
SAGE       = HexColor('#AAC4AA')
SAGE_WASH  = HexColor('#EDF3ED')
CREAM      = HexColor('#FFFBF9')
WINE       = HexColor('#3D1F2A')
MUTED      = HexColor('#8B6F75')
FAINT      = HexColor('#D9BFC4')
GOLD       = HexColor('#C9A45A')

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm

# ── Styles ─────────────────────────────────────────────────────────────────
styles = {
    'cover_title': ParagraphStyle(
        'cover_title', fontName='Times-Bold', fontSize=56, leading=62,
        textColor=WINE, alignment=TA_CENTER,
    ),
    'cover_sub': ParagraphStyle(
        'cover_sub', fontName='Times-Italic', fontSize=15, leading=22,
        textColor=ROSE, alignment=TA_CENTER, spaceBefore=18, spaceAfter=4,
    ),
    'cover_tag': ParagraphStyle(
        'cover_tag', fontName='Helvetica', fontSize=11, leading=18,
        textColor=MUTED, alignment=TA_CENTER,
    ),
    'h1': ParagraphStyle(
        'h1', fontName='Times-Bold', fontSize=28, leading=34,
        textColor=WINE, spaceBefore=0, spaceAfter=4,
    ),
    'h1_sub': ParagraphStyle(
        'h1_sub', fontName='Helvetica-Oblique', fontSize=11, leading=15,
        textColor=ROSE, spaceAfter=14,
    ),
    'h2': ParagraphStyle(
        'h2', fontName='Helvetica-Bold', fontSize=14, leading=18,
        textColor=ROSE, spaceBefore=14, spaceAfter=6,
    ),
    'body': ParagraphStyle(
        'body', fontName='Helvetica', fontSize=10.5, leading=16,
        textColor=WINE, alignment=TA_LEFT, spaceAfter=8,
    ),
    'body_just': ParagraphStyle(
        'body_just', fontName='Helvetica', fontSize=10.5, leading=16,
        textColor=WINE, alignment=TA_JUSTIFY, spaceAfter=8,
    ),
    'step': ParagraphStyle(
        'step', fontName='Helvetica', fontSize=10.5, leading=16,
        textColor=WINE, leftIndent=22, spaceAfter=4,
    ),
    'verse': ParagraphStyle(
        'verse', fontName='Times-Italic', fontSize=11.5, leading=18,
        textColor=WINE, alignment=TA_CENTER,
    ),
    'verse_ref': ParagraphStyle(
        'verse_ref', fontName='Helvetica-Bold', fontSize=9, leading=12,
        textColor=ROSE, alignment=TA_CENTER, spaceBefore=4,
    ),
    'tip_title': ParagraphStyle(
        'tip_title', fontName='Helvetica-Bold', fontSize=10, leading=14,
        textColor=HexColor('#5C7A5C'), spaceAfter=2,
    ),
    'tip_body': ParagraphStyle(
        'tip_body', fontName='Helvetica', fontSize=9.5, leading=14,
        textColor=WINE, spaceAfter=2,
    ),
    'toc_item': ParagraphStyle(
        'toc_item', fontName='Helvetica', fontSize=11.5, leading=22,
        textColor=WINE,
    ),
    'toc_num': ParagraphStyle(
        'toc_num', fontName='Helvetica-Bold', fontSize=11.5, leading=22,
        textColor=ROSE,
    ),
    'small': ParagraphStyle(
        'small', fontName='Helvetica', fontSize=9, leading=13,
        textColor=MUTED,
    ),
}


# ── Custom flowables ───────────────────────────────────────────────────────
class Divider(Flowable):
    """A short rose line with a tiny diamond in the middle — section break."""
    def __init__(self, width=80, color=ROSE):
        super().__init__()
        self.width = width
        self.color = color
        self.height = 14

    def draw(self):
        c = self.canv
        cx = self.width / 2
        c.setStrokeColor(self.color)
        c.setLineWidth(0.6)
        c.line(0, 7, cx - 8, 7)
        c.line(cx + 8, 7, self.width, 7)
        # diamond
        c.setFillColor(self.color)
        c.translate(cx, 7)
        c.rotate(45)
        c.rect(-3, -3, 6, 6, stroke=0, fill=1)
        c.rotate(-45)
        c.translate(-cx, -7)

    def wrap(self, *_):
        return (self.width, self.height)


class VerseCard(Flowable):
    """A scripture callout with soft pink wash."""
    def __init__(self, verse, reference, width=None):
        super().__init__()
        self.verse = verse
        self.reference = reference
        self.width = width or (PAGE_W - 2 * MARGIN)
        self._content_h = None

    def wrap(self, available_w, _):
        self.width = available_w
        # Estimate height: paragraph-driven
        self.p_verse = Paragraph(self.verse, styles['verse'])
        self.p_ref = Paragraph(f"— {self.reference}", styles['verse_ref'])
        w_v, h_v = self.p_verse.wrap(self.width - 40, 9999)
        w_r, h_r = self.p_ref.wrap(self.width - 40, 9999)
        self._content_h = h_v + h_r + 28
        return (self.width, self._content_h)

    def draw(self):
        c = self.canv
        # Soft pink wash background with rounded corners
        c.setFillColor(PINK_WASH)
        c.setStrokeColor(PINK)
        c.setLineWidth(0.4)
        c.roundRect(0, 0, self.width, self._content_h, 8, stroke=1, fill=1)
        # Left rose accent bar
        c.setFillColor(ROSE)
        c.rect(0, 0, 4, self._content_h, stroke=0, fill=1)
        # Render text
        self.p_ref.drawOn(c, 20, 10)
        self.p_verse.drawOn(c, 20, 10 + self.p_ref.height + 6)


class TipCard(Flowable):
    """A sage-tinted 'sister tip' callout."""
    def __init__(self, title, body):
        super().__init__()
        self.title = title
        self.body = body
        self.width = PAGE_W - 2 * MARGIN

    def wrap(self, available_w, _):
        self.width = available_w
        self.p_t = Paragraph(f'<b>{self.title}</b>', styles['tip_title'])
        self.p_b = Paragraph(self.body, styles['tip_body'])
        _, h_t = self.p_t.wrap(self.width - 30, 9999)
        _, h_b = self.p_b.wrap(self.width - 30, 9999)
        self.h = h_t + h_b + 18
        return (self.width, self.h)

    def draw(self):
        c = self.canv
        c.setFillColor(SAGE_WASH)
        c.setStrokeColor(SAGE)
        c.setLineWidth(0.4)
        c.roundRect(0, 0, self.width, self.h, 6, stroke=1, fill=1)
        # Heart icon
        c.setFillColor(SAGE)
        cx, cy = 16, self.h - 14
        c.circle(cx - 3, cy + 1, 2.4, stroke=0, fill=1)
        c.circle(cx + 3, cy + 1, 2.4, stroke=0, fill=1)
        p = c.beginPath()
        p.moveTo(cx - 5, cy + 1)
        p.lineTo(cx, cy - 5)
        p.lineTo(cx + 5, cy + 1)
        p.close()
        c.drawPath(p, stroke=0, fill=1)
        # Text
        self.p_t.drawOn(c, 28, self.h - 16)
        self.p_b.drawOn(c, 28, 8)


class NumberedStep(Flowable):
    """A numbered step with rose circle bullet."""
    def __init__(self, number, text):
        super().__init__()
        self.number = number
        self.text = text
        self.width = PAGE_W - 2 * MARGIN

    def wrap(self, available_w, _):
        self.width = available_w
        self.p = Paragraph(self.text, styles['body'])
        _, h = self.p.wrap(self.width - 32, 9999)
        self.h = max(h, 22) + 4
        return (self.width, self.h)

    def draw(self):
        c = self.canv
        # Number bubble
        c.setFillColor(ROSE)
        c.circle(11, self.h - 12, 9, stroke=0, fill=1)
        c.setFillColor(CREAM)
        c.setFont('Helvetica-Bold', 10)
        c.drawCentredString(11, self.h - 15, str(self.number))
        # Text
        self.p.drawOn(c, 28, self.h - self.p.height - 4)


class PhoneMockup(Flowable):
    """Stylized phone frame with scrollable content drawn inside."""
    def __init__(self, height=190, draw_content=None, label=None):
        super().__init__()
        self._h = height
        self.draw_content = draw_content
        self.label = label
        self.width = 110
        self.height = height + (16 if label else 0)

    def wrap(self, *_):
        return (self.width, self.height)

    def draw(self):
        c = self.canv
        w, h = 110, self._h
        # Phone shadow
        c.setFillColor(Color(0, 0, 0, alpha=0.06))
        c.roundRect(2, -3, w, h, 14, stroke=0, fill=1)
        # Phone body
        c.setFillColor(WINE)
        c.roundRect(0, 0, w, h, 14, stroke=0, fill=1)
        # Screen
        c.setFillColor(CREAM)
        c.roundRect(4, 4, w - 8, h - 8, 10, stroke=0, fill=1)
        # Notch
        c.setFillColor(WINE)
        c.roundRect(w/2 - 14, h - 8, 28, 5, 2, stroke=0, fill=1)
        # Inner content
        c.saveState()
        c.translate(4, 4)
        if self.draw_content:
            self.draw_content(c, w - 8, h - 8)
        c.restoreState()
        # Caption
        if self.label:
            c.setFillColor(MUTED)
            c.setFont('Helvetica-Oblique', 7.5)
            c.drawCentredString(w/2, -12, self.label)


# ── Mockup content drawers ────────────────────────────────────────────────
def draw_signin_mock(c, w, h):
    c.setFillColor(ROSE)
    c.circle(w/2, h - 32, 14, stroke=0, fill=1)
    c.setFillColor(CREAM)
    c.setFont('Times-Bold', 7)
    c.drawCentredString(w/2, h - 34, 'T2:4')
    c.setFillColor(WINE)
    c.setFont('Times-Bold', 11)
    c.drawCentredString(w/2, h - 56, 'Titus 2:4')
    c.setFillColor(MUTED)
    c.setFont('Helvetica', 5.5)
    c.drawCentredString(w/2, h - 66, 'A sisterhood rooted in faith')
    # input fields
    for i, label in enumerate(['Email', 'Password']):
        y = h - 88 - i * 22
        c.setFillColor(PINK_WASH)
        c.roundRect(10, y, w - 20, 14, 4, stroke=0, fill=1)
        c.setFillColor(MUTED)
        c.setFont('Helvetica', 6)
        c.drawString(14, y + 4, label)
    # button
    c.setFillColor(ROSE)
    c.roundRect(10, h - 138, w - 20, 16, 4, stroke=0, fill=1)
    c.setFillColor(CREAM)
    c.setFont('Helvetica-Bold', 6.5)
    c.drawCentredString(w/2, h - 132, 'Sign In')
    c.setFillColor(MUTED)
    c.setFont('Helvetica', 5.5)
    c.drawCentredString(w/2, h - 152, 'Forgot your password?')


def draw_home_mock(c, w, h):
    # top bar
    c.setFillColor(PINK_WASH)
    c.rect(0, h - 20, w, 20, stroke=0, fill=1)
    c.setFillColor(WINE)
    c.setFont('Times-Bold', 9)
    c.drawString(8, h - 14, 'Home')
    # devotional card
    c.setFillColor(PINK_FAINT)
    c.roundRect(6, h - 70, w - 12, 44, 6, stroke=0, fill=1)
    c.setFillColor(ROSE)
    c.setFont('Helvetica-Bold', 6)
    c.drawString(10, h - 36, 'TODAY’S DEVOTIONAL')
    c.setFillColor(WINE)
    c.setFont('Times-Bold', 7.5)
    c.drawString(10, h - 46, 'Walking in Grace')
    c.setFillColor(MUTED)
    c.setFont('Helvetica', 5.5)
    c.drawString(10, h - 55, 'Ephesians 2:8 — For by grace...')
    # post cards
    for i in range(2):
        y = h - 86 - i * 38
        c.setFillColor(CREAM)
        c.setStrokeColor(FAINT)
        c.setLineWidth(0.3)
        c.roundRect(6, y - 30, w - 12, 32, 4, stroke=1, fill=1)
        c.setFillColor(SAGE)
        c.circle(14, y - 8, 5, stroke=0, fill=1)
        c.setFillColor(WINE)
        c.setFont('Helvetica-Bold', 6)
        c.drawString(22, y - 6, ['Sister Grace', 'Sister Hope'][i])
        c.setFillColor(MUTED)
        c.setFont('Helvetica', 5.5)
        text = ['Praise God for today’s', 'Found such peace in'][i]
        c.drawString(22, y - 14, text)
        c.drawString(22, y - 22, ['blessings...', 'morning prayer...'][i])
    # bottom nav
    c.setFillColor(WINE)
    c.rect(0, 0, w, 14, stroke=0, fill=1)
    for i, x in enumerate([0.15, 0.35, 0.55, 0.75]):
        c.setFillColor(ROSE if i == 0 else PINK)
        c.circle(w * x, 7, 2.5, stroke=0, fill=1)


def draw_prayer_mock(c, w, h):
    c.setFillColor(ROSE)
    c.rect(0, h - 20, w, 20, stroke=0, fill=1)
    c.setFillColor(CREAM)
    c.setFont('Times-Bold', 9)
    c.drawString(8, h - 14, 'Prayer Wall')
    # prayer cards
    for i, (cat, name) in enumerate([('HEALTH', 'Sister Mary'), ('FAMILY', 'Anonymous'), ('GUIDANCE', 'Sister Joy')]):
        y = h - 36 - i * 36
        c.setFillColor(PINK_FAINT)
        c.roundRect(6, y - 28, w - 12, 30, 5, stroke=0, fill=1)
        c.setFillColor(ROSE)
        c.setFont('Helvetica-Bold', 5.5)
        c.drawString(10, y - 6, cat)
        c.setFillColor(WINE)
        c.setFont('Helvetica-Bold', 6.5)
        c.drawString(10, y - 14, name)
        c.setFillColor(MUTED)
        c.setFont('Helvetica', 5)
        c.drawString(10, y - 22, 'Praying for...')
        # heart count
        c.setFillColor(ROSE)
        c.setFont('Helvetica', 5.5)
        c.drawRightString(w - 10, y - 22, '♥ 12')


def draw_groups_mock(c, w, h):
    c.setFillColor(SAGE)
    c.rect(0, h - 20, w, 20, stroke=0, fill=1)
    c.setFillColor(CREAM)
    c.setFont('Times-Bold', 9)
    c.drawString(8, h - 14, 'Groups')
    # tabs
    c.setFillColor(PINK_WASH)
    c.roundRect(6, h - 36, w - 12, 12, 3, stroke=0, fill=1)
    c.setFillColor(ROSE)
    c.roundRect(6, h - 36, (w - 12) / 2, 12, 3, stroke=0, fill=1)
    c.setFillColor(CREAM)
    c.setFont('Helvetica-Bold', 5.5)
    c.drawCentredString(6 + (w - 12) / 4, h - 32, 'MY GROUPS')
    c.setFillColor(MUTED)
    c.drawCentredString(6 + 3 * (w - 12) / 4, h - 32, 'BROWSE')
    # group cards
    for i, name in enumerate(['Morning Prayer Sisters', 'New Wives Circle', 'Bible Study — Esther']):
        y = h - 50 - i * 34
        c.setFillColor(CREAM)
        c.setStrokeColor(FAINT)
        c.setLineWidth(0.3)
        c.roundRect(6, y - 26, w - 12, 28, 4, stroke=1, fill=1)
        c.setFillColor(PINK)
        c.circle(14, y - 12, 6, stroke=0, fill=1)
        c.setFillColor(WINE)
        c.setFont('Helvetica-Bold', 6.5)
        c.drawString(24, y - 8, name)
        c.setFillColor(MUTED)
        c.setFont('Helvetica', 5.5)
        c.drawString(24, y - 18, [f'{8} sisters', f'{4} sisters', f'{12} sisters'][i])


def draw_messages_mock(c, w, h):
    c.setFillColor(PINK)
    c.rect(0, h - 20, w, 20, stroke=0, fill=1)
    c.setFillColor(CREAM)
    c.setFont('Times-Bold', 9)
    c.drawString(8, h - 14, 'Messages')
    for i, (name, last) in enumerate([
        ('Sister Grace', 'Praying for you...'),
        ('Sister Hope', 'See you Sunday!'),
        ('Sister Joy', 'Amen sister'),
        ('Pastor Sarah', 'Such a blessing'),
    ]):
        y = h - 32 - i * 30
        c.setFillColor(SAGE if i % 2 == 0 else PINK)
        c.circle(14, y - 12, 6, stroke=0, fill=1)
        c.setFillColor(WINE)
        c.setFont('Helvetica-Bold', 6.5)
        c.drawString(24, y - 8, name)
        c.setFillColor(MUTED)
        c.setFont('Helvetica', 5.5)
        c.drawString(24, y - 18, last)
        if i == 0:
            c.setFillColor(ROSE)
            c.circle(w - 12, y - 12, 3, stroke=0, fill=1)


def draw_events_mock(c, w, h):
    c.setFillColor(GOLD)
    c.rect(0, h - 20, w, 20, stroke=0, fill=1)
    c.setFillColor(CREAM)
    c.setFont('Times-Bold', 9)
    c.drawString(8, h - 14, 'Events')
    for i, (date_top, date_bot, title) in enumerate([
        ('OCT', '12', 'Sisters’ Brunch'),
        ('OCT', '19', 'Worship Night'),
        ('OCT', '26', 'Prayer Walk'),
    ]):
        y = h - 32 - i * 38
        c.setFillColor(PINK_FAINT)
        c.roundRect(6, y - 32, w - 12, 34, 5, stroke=0, fill=1)
        # Date badge
        c.setFillColor(ROSE)
        c.roundRect(10, y - 28, 22, 26, 3, stroke=0, fill=1)
        c.setFillColor(CREAM)
        c.setFont('Helvetica-Bold', 5.5)
        c.drawCentredString(21, y - 10, date_top)
        c.setFont('Helvetica-Bold', 9)
        c.drawCentredString(21, y - 22, date_bot)
        # Title
        c.setFillColor(WINE)
        c.setFont('Helvetica-Bold', 7)
        c.drawString(38, y - 12, title)
        c.setFillColor(MUTED)
        c.setFont('Helvetica', 5.5)
        c.drawString(38, y - 22, '6:30pm • RSVP open')


# ── Page background painters ──────────────────────────────────────────────
def paint_cover(c, _doc):
    # Cream base
    c.setFillColor(CREAM)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    # Top blush blob
    c.setFillColor(Color(247/255, 141/255, 167/255, alpha=0.18))
    c.circle(PAGE_W * 0.85, PAGE_H * 0.92, 110 * mm, stroke=0, fill=1)
    # Sage blob bottom-left
    c.setFillColor(Color(170/255, 196/255, 170/255, alpha=0.16))
    c.circle(PAGE_W * 0.1, PAGE_H * 0.08, 90 * mm, stroke=0, fill=1)
    # Mid blush wash
    c.setFillColor(Color(232/255, 102/255, 138/255, alpha=0.05))
    c.circle(PAGE_W * 0.5, PAGE_H * 0.35, 140 * mm, stroke=0, fill=1)
    # Decorative hairline frame
    c.setStrokeColor(ROSE)
    c.setLineWidth(0.5)
    inset = 14 * mm
    c.rect(inset, inset, PAGE_W - 2 * inset, PAGE_H - 2 * inset, stroke=1, fill=0)
    # Inner hairline
    c.setStrokeColor(PINK)
    c.setLineWidth(0.3)
    inset2 = 16 * mm
    c.rect(inset2, inset2, PAGE_W - 2 * inset2, PAGE_H - 2 * inset2, stroke=1, fill=0)


def paint_inner(c, doc):
    # Base
    c.setFillColor(CREAM)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    # Top rose band
    c.setFillColor(ROSE)
    c.rect(0, PAGE_H - 8 * mm, PAGE_W, 8 * mm, stroke=0, fill=1)
    # Soft side wash
    c.setFillColor(Color(247/255, 141/255, 167/255, alpha=0.06))
    c.rect(0, 0, 10 * mm, PAGE_H, stroke=0, fill=1)
    # Footer line
    c.setStrokeColor(FAINT)
    c.setLineWidth(0.4)
    c.line(MARGIN, 16 * mm, PAGE_W - MARGIN, 16 * mm)
    # Footer text
    c.setFillColor(MUTED)
    c.setFont('Helvetica-Oblique', 8)
    c.drawString(MARGIN, 11 * mm, 'Titus 2:4  —  A sisterhood rooted in faith')
    c.setFont('Helvetica-Bold', 9)
    c.setFillColor(ROSE)
    c.drawRightString(PAGE_W - MARGIN, 11 * mm, str(doc.page))


# ── Document setup ────────────────────────────────────────────────────────
class GuideDoc(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                         topMargin=22 * mm, bottomMargin=22 * mm,
                         title='Titus 2:4 — Welcome Guide',
                         author='Titus 2:4',
                         subject='New sister onboarding guide')
        cover_frame = Frame(MARGIN, MARGIN, PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN, id='cover',
                            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        inner_frame = Frame(MARGIN, 22 * mm, PAGE_W - 2 * MARGIN, PAGE_H - 44 * mm, id='inner',
                            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([
            PageTemplate(id='cover', frames=[cover_frame], onPage=paint_cover),
            PageTemplate(id='inner', frames=[inner_frame], onPage=paint_inner),
        ])


# ── Helpers ───────────────────────────────────────────────────────────────
def section_header(num, title, subtitle):
    return [
        Paragraph(f'<font color="#E8668A">{num:02d}</font> &nbsp; {title}', styles['h1']),
        Paragraph(subtitle, styles['h1_sub']),
    ]


def steps(items):
    return [NumberedStep(i + 1, t) for i, t in enumerate(items)]


def two_column(left, right, lw=0.55):
    """Render two columns side by side using a Table."""
    rw = 1 - lw
    t = Table([[left, right]], colWidths=[(PAGE_W - 2 * MARGIN) * lw, (PAGE_W - 2 * MARGIN) * rw])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (0, 0), 12),
        ('RIGHTPADDING', (1, 0), (1, 0), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    return t


# ── Build story ───────────────────────────────────────────────────────────
def build():
    story = []

    # ── COVER ──
    story.append(Spacer(1, 70 * mm))
    story.append(Paragraph('Titus 2:4', styles['cover_title']))
    story.append(Spacer(1, 4 * mm))
    story.append(Divider(width=PAGE_W - 4 * MARGIN))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        '<i>"That they may teach the young women to be sober, to love their husbands, to love their children..."</i>',
        styles['cover_sub']))
    story.append(Paragraph('Titus 2:4', styles['verse_ref']))
    story.append(Spacer(1, 18 * mm))
    story.append(Paragraph('A WELCOME GUIDE FOR NEW SISTERS', styles['cover_tag']))
    story.append(Spacer(1, 50 * mm))
    story.append(Paragraph(
        'A sisterhood rooted in faith,<br/>growing towards God’s design for love and marriage.',
        styles['cover_tag']))
    story.append(PageBreak())

    # ── PAGE 2: Welcome letter + TOC ──
    story.append(Paragraph('A Letter to You, Sister', styles['h1']))
    story.append(Paragraph('Welcome home.', styles['h1_sub']))
    story.append(Paragraph(
        'Beloved sister, we’re so glad you’re here. Titus 2:4 is more than an app — '
        'it’s a digital sisterhood. A place where women across cities, life-stages, and '
        'seasons gather to pray together, encourage one another, study Scripture, and grow in '
        'God’s design for love, marriage, and family.', styles['body_just']))
    story.append(Paragraph(
        'You don’t have to figure it out alone. This guide will walk you, gently, through '
        'every part of the app — what each section is for, how to use it, and small tips '
        'from sisters who’ve been here before you. Take your time. Read the parts you '
        'need. Come back to it whenever you’d like.', styles['body_just']))
    story.append(Spacer(1, 6))
    story.append(VerseCard(
        'She is clothed with strength and dignity, and she laughs without fear of the future.',
        'Proverbs 31:25'))
    story.append(Spacer(1, 14))
    story.append(Paragraph('What’s Inside', styles['h2']))
    story.append(Divider(width=PAGE_W - 2 * MARGIN))
    story.append(Spacer(1, 6))

    toc_data = [
        ('01', 'Getting Started', 'Sign up, verify, log in'),
        ('02', 'Your Home & Daily Devotional', 'Where each day begins'),
        ('03', 'Community', 'Sharing in the feed'),
        ('04', 'The Prayer Wall', 'Praying with and for sisters'),
        ('05', 'Groups', 'Smaller circles, deeper bonds'),
        ('06', 'Events & Bible Study', 'Gathering and growing in the Word'),
        ('07', 'Messages, Profile & Notifications', 'Staying connected'),
        ('08', 'Discover', 'Search, directory, gallery, resources'),
        ('09', 'A Sister’s Promise', 'Closing words'),
    ]
    toc_rows = []
    for num, title, sub in toc_data:
        toc_rows.append([
            Paragraph(num, styles['toc_num']),
            Paragraph(f'<b>{title}</b><br/><font size="9" color="#8B6F75">{sub}</font>',
                      styles['toc_item']),
        ])
    toc_table = Table(toc_rows, colWidths=[18 * mm, PAGE_W - 2 * MARGIN - 18 * mm])
    toc_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, FAINT),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(toc_table)
    story.append(PageBreak())

    # ── PAGE 3: Getting Started ──
    story.extend(section_header(1, 'Getting Started', 'Welcome aboard — your first three minutes.'))
    story.append(Paragraph(
        'Before anything else, you’ll create your account and tell us a little about who you '
        'are. This helps your sisters across the world know who they’re praying with.',
        styles['body_just']))

    left_col = [
        Paragraph('Creating your account', styles['h2']),
        NumberedStep(1, 'Open the app and tap <b>Sign Up</b> at the bottom of the welcome screen.'),
        NumberedStep(2, 'Enter your <b>first name</b>, <b>email</b>, and a <b>password</b> '
                        '(at least 6 characters — something only you would know).'),
        NumberedStep(3, 'Tap <b>Create Account</b>. We’ll send a quick email asking you '
                        'to confirm it’s really you.'),
        NumberedStep(4, 'Open that email and tap the link. You’ll be brought back into '
                        'the app, signed in.'),
        Spacer(1, 8),
        Paragraph('Forgot your password?', styles['h2']),
        Paragraph(
            'It happens to the best of us. On the sign-in screen, tap <b>"Forgot your password?"</b>, '
            'enter your email, and tap <b>Send Reset Link</b>. Check your inbox (and spam folder, just '
            'in case) for an email from Titus 2:4. Tap the link, choose a new password, and you’re back in.',
            styles['body_just']),
        Spacer(1, 6),
        TipCard('Sister tip',
                'Use the same email you check most often. Password resets, prayer notifications, '
                'and event reminders will all come there.'),
    ]
    right_col = [
        PhoneMockup(height=240, draw_content=draw_signin_mock, label='The sign-in screen'),
        Spacer(1, 14),
    ]
    story.append(two_column(left_col, right_col, lw=0.62))

    story.append(Spacer(1, 10))
    story.append(Paragraph('Telling us about yourself', styles['h2']))
    story.append(Paragraph(
        'After signing in for the first time, we’ll ask for a <b>city and country</b> '
        '(or just a country if you’d rather keep it general), and you can add a profile '
        'photo. None of this is required for everything — you can fill in more later from '
        'the <b>Profile</b> tab.',
        styles['body_just']))
    story.append(PageBreak())

    # ── PAGE 4: Home + Devotional ──
    story.extend(section_header(2, 'Your Home & Daily Devotional',
                                'Where each day begins.'))

    left_col = [
        Paragraph(
            'When you open the app, the <b>Home</b> tab is the first thing you see. Think of it as '
            'your front door — a gentle place to begin.', styles['body_just']),
        Paragraph('What you’ll find here', styles['h2']),
        Paragraph(
            '• <b>Today’s Devotional</b> — a short scripture, reflection, '
            'and prayer prepared for the day.<br/>'
            '• <b>This Week</b> — a glimpse of upcoming events, birthdays, and '
            'celebrations among your sisters.<br/>'
            '• <b>Recent activity</b> — the latest posts, prayer requests, and '
            'group check-ins, gathered in one feed so you don’t miss a thing.',
            styles['body']),
        Spacer(1, 6),
        Paragraph('Reading the devotional', styles['h2']),
        Paragraph(
            'Tap the devotional card on Home, or open the <b>Devotional</b> tab. Each one '
            'includes a <b>theme</b>, a <b>scripture passage</b>, a <b>reflection</b>, an '
            '<b>affirmation</b> to carry through your day, and a closing <b>prayer</b>.',
            styles['body_just']),
        TipCard('A gentle rhythm',
                'Try reading the devotional first thing with your morning tea, then return in '
                'the evening to share what God showed you in Community.'),
    ]
    right_col = [
        PhoneMockup(height=240, draw_content=draw_home_mock, label='Your Home feed'),
    ]
    story.append(two_column(left_col, right_col, lw=0.62))

    story.append(Spacer(1, 10))
    story.append(Divider(width=PAGE_W - 2 * MARGIN))
    story.append(Spacer(1, 8))
    story.append(VerseCard(
        'This is the day that the Lord has made; let us rejoice and be glad in it.',
        'Psalm 118:24'))
    story.append(PageBreak())

    # ── PAGE 5: Community ──
    story.extend(section_header(3, 'Community',
                                'Sharing the everyday with one another.'))
    story.append(Paragraph(
        'The <b>Community</b> tab is where sisters share life. A blessing from this morning. '
        'A photograph of a sunset that reminded you of God’s faithfulness. A worship song '
        'on your heart. A question you’re wrestling with. There’s no pressure to '
        'post — reading and reacting is just as much a part of being here.', styles['body_just']))

    story.append(Paragraph('Sharing a post', styles['h2']))
    story.extend(steps([
        'Tap the <b>+</b> button (or the writing area) at the top of the Community feed.',
        'Type what’s on your heart. Add a photo if you’d like — tap the image icon.',
        'Tap <b>Share</b>. Your post appears immediately at the top of the feed.',
    ]))

    story.append(Spacer(1, 6))
    story.append(Paragraph('Reacting and commenting', styles['h2']))
    story.append(Paragraph(
        'Beneath every post you’ll see small icons — a heart, a praise hand, an amen, '
        'a hug. Tap any of them to send love to the sister who shared. To leave words, tap the '
        '<b>speech bubble</b> and write a comment. Replies are nested, so a conversation can '
        'unfold without getting tangled.',
        styles['body_just']))

    story.append(Spacer(1, 6))
    story.append(TipCard('A note on our tone',
                         'We aim to encourage, never to tear down. If a post is asking for advice, '
                         'lead with prayer and gentleness. If something a sister wrote troubles you, '
                         'reach out privately or speak to one of the elders — don’t debate '
                         'in the comments.'))
    story.append(Spacer(1, 8))
    story.append(VerseCard(
        'Therefore encourage one another and build each other up, just as in fact you are doing.',
        '1 Thessalonians 5:11'))
    story.append(PageBreak())

    # ── PAGE 6: Prayer Wall ──
    story.extend(section_header(4, 'The Prayer Wall',
                                'Where we lift each other up before the Lord.'))

    left_col = [
        Paragraph(
            'The <b>Prayer Wall</b> is the heart of Titus 2:4. Every sister carries something — '
            'a husband’s health, a child’s wandering, a job interview, a longing for a '
            'baby. Bring it here. Watch how the body of Christ holds you.', styles['body_just']),
        Paragraph('Submitting a request', styles['h2']),
        NumberedStep(1, 'Open the <b>Prayer</b> tab and tap <b>+ New Prayer Request</b>.'),
        NumberedStep(2, 'Choose a <b>category</b> — Health, Family, Marriage, Guidance, '
                        'Praise, Other — so sisters can find what speaks to them.'),
        NumberedStep(3, 'Type your request. Tap the <b>Anonymous</b> toggle if you’d rather '
                        'not be named (your sisters will still pray; only your name is hidden).'),
        NumberedStep(4, 'Tap <b>Share</b>. Your request joins the wall.'),
        Spacer(1, 6),
        Paragraph('When God answers', styles['h2']),
        Paragraph(
            'Open your request and tap <b>Mark as Answered</b>. Your testimony will move into the '
            '<b>Praise Reports</b> section, encouraging every sister who reads it.', styles['body_just']),
    ]
    right_col = [
        PhoneMockup(height=240, draw_content=draw_prayer_mock, label='The Prayer Wall'),
    ]
    story.append(two_column(left_col, right_col, lw=0.62))

    story.append(Spacer(1, 8))
    story.append(Paragraph('Praying for a sister', styles['h2']))
    story.append(Paragraph(
        'Tap the <b>praying-hands</b> icon on any request. The sister who posted is gently '
        'notified that someone is interceding for her. You can also tap <b>Send encouragement</b> '
        'to leave a short scripture or note. Your name appears — sisters love knowing who '
        'is standing with them.',
        styles['body_just']))
    story.append(Spacer(1, 6))
    story.append(VerseCard(
        'Confess your sins to each other and pray for each other so that you may be healed.',
        'James 5:16'))
    story.append(PageBreak())

    # ── PAGE 7: Groups ──
    story.extend(section_header(5, 'Groups',
                                'Smaller circles. Deeper bonds.'))

    left_col = [
        Paragraph(
            'Sometimes the wider sisterhood is exactly what you need. Other times, you long for '
            'a smaller circle — a few sisters who know your name, your story, and what to '
            'pray for week by week. That’s what <b>Groups</b> are for.', styles['body_just']),
        Paragraph('Finding a group', styles['h2']),
        NumberedStep(1, 'Open the <b>Groups</b> tab. If you’re not yet in any, you’ll '
                        'land on <b>Browse</b>.'),
        NumberedStep(2, 'Scroll through public groups — each shows its name, a short '
                        'description, and how many sisters have joined.'),
        NumberedStep(3, 'Tap a group that speaks to your season, then tap <b>Join</b>.'),
        Spacer(1, 6),
        Paragraph('Inside a group', styles['h2']),
        Paragraph(
            'Once you’re in, the group has its own little discussion space. Share <b>check-ins</b> '
            '(short updates on how the week’s going), respond to other sisters, and pray '
            'specifically for one another.', styles['body_just']),
    ]
    right_col = [
        PhoneMockup(height=240, draw_content=draw_groups_mock, label='Browsing groups'),
    ]
    story.append(two_column(left_col, right_col, lw=0.62))

    story.append(Spacer(1, 6))
    story.append(Paragraph('Leaving a group', styles['h2']))
    story.append(Paragraph(
        'Seasons change. If a group no longer fits, open it and tap <b>Leave Group</b> at the '
        'bottom. You can rejoin later if it’s a public group, and your past messages stay '
        'so the conversation isn’t broken for the others.', styles['body_just']))

    story.append(Spacer(1, 4))
    story.append(TipCard('Private groups',
                         'Some groups are private — you’ll need to be invited by a leader. '
                         'These are usually for specific seasons (newlyweds, expectant mothers, '
                         'grief and loss). If one calls to you, ask an elder.'))
    story.append(PageBreak())

    # ── PAGE 8: Events + Bible Study ──
    story.extend(section_header(6, 'Events & Bible Study',
                                'Gathering and growing in the Word.'))

    left_col = [
        Paragraph('Events', styles['h2']),
        Paragraph(
            'The <b>Events</b> tab lists every gathering on the calendar — brunches, '
            'worship nights, prayer walks, retreats, in-person meet-ups in your city. Each '
            'event card shows the date, time, location, and how many sisters have RSVP’d.',
            styles['body']),
        Paragraph('To RSVP', styles['h2']),
        NumberedStep(1, 'Tap any event to open it.'),
        NumberedStep(2, 'Tap <b>Going</b>, <b>Maybe</b>, or <b>Can’t make it</b>.'),
        NumberedStep(3, 'Optional: tap <b>Set reminder</b> to be nudged a few hours before.'),
        Spacer(1, 6),
        Paragraph('Bible Study', styles['h2']),
        Paragraph(
            'The <b>Study</b> tab holds guided studies through Scripture — sometimes a '
            'book of the Bible, sometimes a theme like prayer, marriage, or motherhood. Each '
            'study is broken into daily readings.',
            styles['body_just']),
        NumberedStep(1, 'Tap a study you’d like to begin and tap <b>Enrol</b>.'),
        NumberedStep(2, 'Each day, open Day 1, 2, 3... read the scripture, the reflection, '
                        'and the journal prompt.'),
        NumberedStep(3, 'Tap <b>Mark complete</b> when you’ve sat with it. You can write '
                        'a short reflection too — only you see it.'),
    ]
    right_col = [
        PhoneMockup(height=240, draw_content=draw_events_mock, label='Upcoming events'),
    ]
    story.append(two_column(left_col, right_col, lw=0.62))

    story.append(Spacer(1, 8))
    story.append(VerseCard(
        'Your word is a lamp for my feet, a light on my path.',
        'Psalm 119:105'))
    story.append(PageBreak())

    # ── PAGE 9: Messages, Profile, Notifications ──
    story.extend(section_header(7, 'Messages, Profile & Notifications',
                                'Staying connected.'))

    left_col = [
        Paragraph('Direct Messages', styles['h2']),
        Paragraph(
            'For private conversations — a check-in, a personal prayer request, '
            'a one-on-one encouragement — use <b>Messages</b>.', styles['body_just']),
        NumberedStep(1, 'Find a sister you’d like to message: open her profile from a '
                        'post, comment, or the Directory, then tap <b>Message</b>.'),
        NumberedStep(2, 'Type and tap send. New messages appear in real time and you’ll '
                        'be notified when she replies.'),
        Spacer(1, 6),
        Paragraph('Your Profile', styles['h2']),
        Paragraph(
            'Open the <b>Profile</b> tab to update your photo, your city, your favourite verse, '
            'or a short bio. You can also change to dark mode here, and review your earned '
            'badges (yes — there are gentle little badges for showing up faithfully).',
            styles['body_just']),
        Spacer(1, 4),
        Paragraph('Notifications', styles['h2']),
        Paragraph(
            'The <b>bell</b> in the top corner shows when something new happens for you — '
            'someone reacted to your post, prayed for your request, replied to your comment, '
            'or messaged you. Tap any notification to jump straight to it.', styles['body_just']),
    ]
    right_col = [
        PhoneMockup(height=240, draw_content=draw_messages_mock, label='Your conversations'),
    ]
    story.append(two_column(left_col, right_col, lw=0.62))

    story.append(Spacer(1, 6))
    story.append(TipCard('Quiet hours',
                         'You can mute notifications during quiet hours from your Profile settings. '
                         'God speaks in silence too.'))
    story.append(PageBreak())

    # ── PAGE 10: Discover + closing ──
    story.extend(section_header(8, 'Discover',
                                'There is more to find here than first meets the eye.'))

    discover_items = [
        ('Search', 'A magnifying glass at the top of any page. Type a sister’s name, a '
                   'word from a post, or a scripture reference.'),
        ('Directory', 'A list of every sister, with her city. Tap any name to see her profile, '
                      'send a message, or follow her posts.'),
        ('Gallery', 'Photo albums from past events. Tap to view, tap-and-hold to save your '
                    'favourites.'),
        ('Resources', 'A library of books, podcasts, sermons, and articles your sisters have '
                      'recommended.'),
        ('Ask Elders', 'A space to ask a question of the spiritual leadership privately. They '
                       'reply gently, in their own time.'),
        ('Guide', 'Help and instructions — essentially this booklet, available in the app '
                  'whenever you need it.'),
    ]
    rows = []
    for title, desc in discover_items:
        rows.append([
            Paragraph(f'<font color="#E8668A"><b>{title}</b></font>', styles['toc_item']),
            Paragraph(desc, styles['body']),
        ])
    discover_table = Table(rows, colWidths=[34 * mm, PAGE_W - 2 * MARGIN - 34 * mm])
    discover_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LINEBELOW', (0, 0), (-1, -2), 0.3, FAINT),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(discover_table)

    story.append(Spacer(1, 16))
    story.append(Divider(width=PAGE_W - 2 * MARGIN))
    story.append(Spacer(1, 12))

    # ── Closing ──
    story.append(Paragraph('A Sister’s Promise', styles['h1']))
    story.append(Paragraph('Before you put this guide down...', styles['h1_sub']))
    story.append(Paragraph(
        'Sister, this app is a <b>tool</b> — a beautiful, useful, sometimes imperfect '
        'tool. The real work happens in your prayer closet, in your home, in the cup of tea '
        'you share with the sister God places in front of you. We hope Titus 2:4 helps you '
        'find each other.', styles['body_just']))
    story.append(Paragraph(
        'If something breaks, doesn’t feel right, or you have an idea to make it '
        'better — use <b>Ask Elders</b> and tell us. This is our home together. We '
        'tend it together.', styles['body_just']))
    story.append(Spacer(1, 8))
    story.append(VerseCard(
        'And let us consider how we may spur one another on toward love and good deeds, '
        'not giving up meeting together.',
        'Hebrews 10:24-25'))
    story.append(Spacer(1, 16))
    story.append(Paragraph(
        '<font color="#E8668A"><b>Welcome home, sister. We’re so glad you’re here.</b></font>',
        ParagraphStyle('closer', parent=styles['body'], alignment=TA_CENTER, fontSize=12, leading=18)))

    return story


def main():
    output = 'Titus24_Welcome_Guide.pdf'
    doc = GuideDoc(output)
    story = build()
    # Force inner template starting from page 2
    from reportlab.platypus import NextPageTemplate
    story.insert(0, NextPageTemplate('cover'))
    # After the first PageBreak, switch to inner
    # Find first PageBreak and insert NextPageTemplate before it
    new_story = []
    switched = False
    for f in story:
        if not switched and isinstance(f, PageBreak):
            new_story.append(NextPageTemplate('inner'))
        new_story.append(f)
        if isinstance(f, PageBreak) and not switched:
            switched = True
    doc.build(new_story)
    print(f'Wrote {output}')


if __name__ == '__main__':
    main()
