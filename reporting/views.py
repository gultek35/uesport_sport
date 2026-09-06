from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Max, Min, Count
from django.utils import timezone
from django.http import FileResponse
from core.models import AthleteProfile, Person
from measurement.models import MeasurementResult, DerivedMeasurementResult
from norm.models import NormResult
from catalog.models import TestDefinition
from planning.models import TestSession
import uuid
from datetime import datetime

# 📌 AI Yorum Motoru
from .ai_comment import generate_ai_comment, generate_ai_summary

# 📌 PDF Servisi
from .pdf_service import generate_athlete_report_pdf

# 📌 Excel Servisi
from .excel_service import generate_athlete_report_excel


class AthleteReportViewSet(viewsets.ViewSet):
    """
    Sporcu bazlı performans raporu (AI yorum desteği ile)
    """
    permission_classes = [permissions.AllowAny]

    def retrieve(self, request, pk=None):
        """Sporcu performans raporunu getir"""
        try:
            # 📌 PK'yi UUID olarak doğrula
            try:
                athlete_id = uuid.UUID(pk)
            except (ValueError, TypeError):
                return Response(
                    {"error": "Geçersiz sporcu ID formatı. UUID formatında olmalı."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 1. Sporcu bilgilerini al
            athlete = AthleteProfile.objects.get(id=athlete_id)
            person = athlete.person

            # 2. Sporcunun tüm test sonuçlarını al
            measurement_results = MeasurementResult.objects.filter(
                participant_ref=athlete_id,
                is_valid=True,
                status='PUBLISHED'
            ).select_related('batch')

            # 3. Norm sonuçlarını al (metric_ref ile eşleştirmek için)
            norm_results = NormResult.objects.filter(
                participant_id=athlete_id,
                status='PUBLISHED'
            )

            # 4. Rapor verilerini hazırla (AI yorum ile)
            results_data = []
            for mr in measurement_results:
                # Norm bilgisini metric_ref ile eşleştir
                norm = norm_results.filter(metric_ref=mr.metric_ref).first()
                
                # Test tanımını bul
                test_def = TestDefinition.objects.filter(id=mr.test_definition_ref).first()
                
                # Test adını güvenli şekilde al
                test_adi = None
                if test_def and test_def.name:
                    test_adi = test_def.name.get('tr', test_def.name.get('en', test_def.code))
                elif test_def:
                    test_adi = test_def.code
                
                # Norm bilgisi
                norm_bilgisi = {
                    "yuzdelik_dilim": float(norm.norm_percentile) if norm and norm.norm_percentile else None,
                    "z_skor": float(norm.norm_z_score) if norm and norm.norm_z_score else None,
                    "etiket": norm.norm_label if norm else None,
                    "ortalama": float(norm.norm_mean) if norm and norm.norm_mean else None,
                    "standart_sapma": float(norm.norm_sd) if norm and norm.norm_sd else None,
                    "populasyon": str(norm.population_id) if norm and norm.population_id else None
                } if norm else None

                # 📌 Sonuç öğesini oluştur
                result_item = {
                    "test_kodu": test_def.code if test_def else None,
                    "test_adi": test_adi,
                    "metrik_kodu": str(mr.metric_ref),
                    "deger": float(mr.canonical_value) if mr.canonical_value else None,
                    "birim": mr.canonical_unit_code,
                    "tarih": mr.captured_at,
                    "norm_bilgisi": norm_bilgisi,
                }

                # 📌 AI yorum ekle
                result_item["ai_yorum"] = generate_ai_comment(
                    result_item,
                    norm_bilgisi,
                    {
                        'yas': calculate_age(person.date_of_birth),
                        'cinsiyet': person.gender
                    }
                )
                
                results_data.append(result_item)

            # 5. Rapor JSON'unu oluştur
            report_data = {
                "sporcu": {
                    "id": str(athlete.id),
                    "ad_soyad": f"{person.first_name} {person.last_name}",
                    "dogum_tarihi": person.date_of_birth,
                    "yas": calculate_age(person.date_of_birth),
                    "cinsiyet": person.gender,
                    "spor_dali": str(athlete.sport_context_ref) if athlete.sport_context_ref else None,
                    "level": athlete.level
                },
                "rapor_tarihi": timezone.now().isoformat(),
                "toplam_test_sayisi": len(results_data),
                "sonuclar": results_data,
                "ozet": generate_summary(results_data),
                # 📌 GENEL AI ÖZETİ
                "ai_ozet": generate_ai_summary(results_data, {
                    'ad_soyad': f"{person.first_name} {person.last_name}"
                })
            }

            return Response(report_data, status=status.HTTP_200_OK)

        except AthleteProfile.DoesNotExist:
            return Response({"error": "Sporcu bulunamadı"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # ================== PDF RAPOR ==================
    @action(detail=False, methods=['get'])
    def pdf(self, request):
        """Sporcu raporunu PDF olarak indir"""
        athlete_id = request.query_params.get('athlete_id')
        
        if not athlete_id:
            return Response(
                {"error": "athlete_id parametresi gerekli"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Rapor verilerini al
            response = self.retrieve(request, pk=athlete_id)
            
            if response.status_code != 200:
                return response
            
            # PDF oluştur
            pdf_buffer = generate_athlete_report_pdf(response.data)
            
            # PDF dosyasını döndür
            filename = f"rapor_{athlete_id[:8]}_{datetime.now().strftime('%Y%m%d')}.pdf"
            return FileResponse(
                pdf_buffer,
                as_attachment=True,
                filename=filename,
                content_type='application/pdf'
            )
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ================== EXCEL RAPOR ==================
    @action(detail=False, methods=['get'])
    def excel(self, request):
        """Sporcu raporunu Excel olarak indir"""
        athlete_id = request.query_params.get('athlete_id')
        
        if not athlete_id:
            return Response(
                {"error": "athlete_id parametresi gerekli"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Rapor verilerini al
            response = self.retrieve(request, pk=athlete_id)
            
            if response.status_code != 200:
                return response
            
            # Excel oluştur
            excel_buffer = generate_athlete_report_excel(response.data)
            
            # Excel dosyasını döndür
            filename = f"rapor_{athlete_id[:8]}_{datetime.now().strftime('%Y%m%d')}.xlsx"
            return FileResponse(
                excel_buffer,
                as_attachment=True,
                filename=filename,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ================== SPORCU DAĞILIMI (YENİ) ==================
    @action(detail=False, methods=['get'])
    def sport_distribution(self, request):
        """
        Sporcu branş dağılımını getir
        """
        try:
            # 📌 level alanına göre grupla (veya sport_context_ref)
            distribution = (
                AthleteProfile.objects
                .values('level')
                .annotate(count=Count('id'))
                .order_by('-count')
            )
            
            # 📌 level'i null olanları da dahil et
            total = AthleteProfile.objects.count()
            
            # 📌 Boş level'ları "Diğer" olarak göster
            result = []
            for item in distribution:
                level = item['level'] or 'Diğer'
                result.append({
                    'level': level,
                    'count': item['count']
                })
            
            return Response({
                'distribution': result,
                'total': total
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ================== YARDIMCI FONKSİYONLAR ==================

def calculate_age(birth_date):
    """Doğum tarihinden yaş hesapla"""
    from datetime import date
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


def generate_summary(results):
    """Sonuçlara göre özet rapor oluştur"""
    if not results:
        return {
            "guclu_yonler": [],
            "gelisim_alanlari": [],
            "genel_degerlendirme": "Henüz yeterli test verisi bulunmuyor."
        }
    
    strong = []
    weak = []
    
    for r in results:
        norm = r.get('norm_bilgisi')
        if norm:
            label = norm.get('etiket', '')
            if label in ['EXCELLENT', 'GOOD', 'İyi', 'Çok İyi', 'Mükemmel']:
                strong.append(r.get('test_adi', r.get('test_kodu')))
            elif label in ['POOR', 'VERY_POOR', 'Zayıf', 'Çok Zayıf']:
                weak.append(r.get('test_adi', r.get('test_kodu')))
    
    return {
        "guclu_yonler": strong[:5],
        "gelisim_alanlari": weak[:5],
        "genel_degerlendirme": f"Sporcu, {len(strong)} testte iyi performans gösterirken, {len(weak)} testte gelişime ihtiyaç duyuyor."
    }