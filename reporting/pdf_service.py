"""
PDF Rapor Servisi - Sporcu performans raporunu PDF olarak olusturur.
"""
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from datetime import datetime


def generate_athlete_report_pdf(report_data):
    """
    Sporcu performans raporunu PDF olarak olusturur.

    Args:
        report_data: Rapor verileri (dict)

    Returns:
        BytesIO: PDF dosyasi
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                           rightMargin=2*cm, leftMargin=2*cm,
                           topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    story = []

    # 📌 Baslik
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=10
    )

    title = "<b>UESPORT - Performans Raporu</b>"
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 0.3*cm))

    # 📌 Sporcu Bilgileri
    athlete = report_data.get("sporcu", {})
    date_style = ParagraphStyle(
        "DateStyle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.grey
    )

    story.append(Paragraph(f"<b>Sporcu:</b> {athlete.get('ad_soyad', '')}", styles["Normal"]))
    story.append(Paragraph(f"<b>Yas:</b> {athlete.get('yas', '')}", styles["Normal"]))
    story.append(Paragraph(f"<b>Cinsiyet:</b> {athlete.get('cinsiyet', '')}", styles["Normal"]))
    story.append(Paragraph(f"<b>Seviye:</b> {athlete.get('level', '')}", styles["Normal"]))
    story.append(Paragraph(f"<b>Rapor Tarihi:</b> {datetime.now().strftime('%d.%m.%Y %H:%M')}", date_style))
    story.append(Spacer(1, 0.5*cm))

    # 📌 Test Sonuclari Tablosu
    story.append(Paragraph("<b>📋 Test Sonuclari</b>", styles["Heading2"]))
    story.append(Spacer(1, 0.3*cm))

    results = report_data.get("sonuclar", [])

    if results:
        table_data = [
            ["Test", "Deger", "Yuzdelik Dilim", "Z-Skor", "Durum"]
        ]

        for r in results:
            norm = r.get("norm_bilgisi", {})
            table_data.append([
                r.get("test_adi", ""),
                f"{r.get('deger', '')} {r.get('birim', '')}",
                f"{norm.get('yuzdelik_dilim', '')}%" if norm else "-",
                f"{norm.get('z_skor', '')}" if norm else "-",
                norm.get("etiket", "-") if norm else "-"
            ])

        table = Table(table_data, colWidths=[4.5*cm, 2.5*cm, 2.5*cm, 2*cm, 2.5*cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a1a2e")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8f9fa")),
            ("BACKGROUND", (0, 2), (-1, -1), colors.white),
            ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#dee2e6")),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(table)
        story.append(Spacer(1, 0.5*cm))

    # 📌 AI Yorumlari
    for r in results:
        ai_yorum = r.get("ai_yorum")
        if ai_yorum:
            story.append(Paragraph(f"<b>{r.get('test_adi', '')}:</b> {ai_yorum}", styles["Normal"]))
            story.append(Spacer(1, 0.2*cm))

    story.append(Spacer(1, 0.5*cm))

    # 📌 Ozet
    ozet = report_data.get("ozet", {})
    story.append(Paragraph("<b>📝 Performans Ozeti</b>", styles["Heading2"]))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(ozet.get("genel_degerlendirme", ""), styles["Normal"]))
    story.append(Spacer(1, 0.3*cm))

    # 📌 AI Ozet
    ai_ozet = report_data.get("ai_ozet", "")
    if ai_ozet:
        story.append(Paragraph("<b>🤖 AI Degerlendirmesi</b>", styles["Heading2"]))
        story.append(Spacer(1, 0.2*cm))
        story.append(Paragraph(ai_ozet, styles["Normal"]))

    doc.build(story)
    buffer.seek(0)
    return buffer
