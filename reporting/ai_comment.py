"""
AI Yorum Motoru - Sporcu performans raporları için otomatik yorum üretir.
"""

def generate_ai_comment(result, norm, athlete):
    """
    Tek bir test sonucu için AI yorumu üretir.
    
    Args:
        result: Test sonucu (dict)
        norm: Norm bilgisi (dict veya None)
        athlete: Sporcu bilgileri (dict)
    
    Returns:
        str: AI yorumu
    """
    if not norm:
        return "Bu test için yeterli norm verisi bulunmuyor."

    label = norm.get('etiket', '')
    test_adi = result.get('test_adi', 'Test')
    
    yorum = ""
    
    if label in ['Mükemmel', 'Çok İyi', 'EXCELLENT']:
        yorum = f"{test_adi} testinde, yaşıtlarına göre çok üstün bir performans sergiliyor. "
        yorum += "Bu alandaki güçlü yönlerini koruması ve geliştirmeye devam etmesi önerilir."
    
    elif label in ['İyi', 'GOOD']:
        yorum = f"{test_adi} testinde, yaşıtlarına göre iyi bir performans sergiliyor. "
        yorum += "Mevcut seviyesini korumak ve küçük iyileştirmelerle daha üst seviyelere çıkabilir."
    
    elif label in ['Ortalama', 'AVERAGE']:
        yorum = f"{test_adi} testinde, yaşıtlarına göre ortalama bir performans sergiliyor. "
        yorum += "Bu alana yönelik özel antrenman programları ile gelişim sağlanabilir."
    
    elif label in ['Zayıf', 'POOR']:
        yorum = f"{test_adi} testinde, yaşıtlarına göre zayıf bir performans sergiliyor. "
        yorum += "Bu alana öncelik verilmesi ve geliştirici antrenmanlar uygulanması önerilir."
    
    elif label in ['Çok Zayıf', 'VERY_POOR']:
        yorum = f"{test_adi} testinde, yaşıtlarına göre çok zayıf bir performans sergiliyor. "
        yorum += "Acil olarak bu alana yönelik özel çalışma programı oluşturulmalıdır."
    
    else:
        yorum = f"{test_adi} test sonucu değerlendirilmiştir. Detaylı analiz için uzman görüşü alınması önerilir."
    
    return yorum


def generate_ai_summary(results, athlete):
    """
    Tüm sonuçlara göre genel AI özeti üretir.
    
    Args:
        results: Tüm test sonuçları (list)
        athlete: Sporcu bilgileri (dict)
    
    Returns:
        str: AI özeti
    """
    if not results:
        return "Henüz yeterli test verisi bulunmuyor."
    
    guclu = []
    zayif = []
    
    for r in results:
        norm = r.get('norm_bilgisi')
        if norm:
            label = norm.get('etiket', '')
            if label in ['Mükemmel', 'Çok İyi', 'EXCELLENT', 'İyi', 'GOOD']:
                guclu.append(r.get('test_adi', r.get('test_kodu')))
            elif label in ['Zayıf', 'Çok Zayıf', 'POOR', 'VERY_POOR']:
                zayif.append(r.get('test_adi', r.get('test_kodu')))
    
    yorum = f"{athlete.get('ad_soyad', 'Sporcu')}, "
    
    if guclu and zayif:
        yorum += f"{len(guclu)} testte güçlü, {len(zayif)} testte gelişime ihtiyaç duyan bir performans profiline sahip. "
        yorum += f"Güçlü yönleri: {', '.join(guclu[:3])}. Gelişim alanları: {', '.join(zayif[:3])}."
    elif guclu:
        yorum += f"{len(guclu)} testte güçlü bir performans sergiliyor. "
        yorum += f"Özellikle {', '.join(guclu[:3])} alanlarında üstün."
    elif zayif:
        yorum += f"{len(zayif)} testte gelişime ihtiyaç duyuyor. "
        yorum += f"Özellikle {', '.join(zayif[:3])} alanlarına odaklanılmalı."
    else:
        yorum += "performans verileri değerlendirilmiştir. Detaylı analiz için uzman görüşü alınması önerilir."
    
    return yorum