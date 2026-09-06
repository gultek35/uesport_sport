import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

# ================== USER MODEL (ÖZEL KULLANICI) ==================
class User(AbstractUser):
    """
    Özel User modeli. AbstractUser'dan türetilmiştir.
    Django'nun varsayılan User modelini genişletir.
    """
    # 📌 YENİ ALANLAR (Dil ve Ülke Tercihi)
    preferred_language = models.CharField(
        max_length=10,
        choices=[
            ('en', 'English'),
            ('tr', 'Türkçe'),
            ('de', 'Deutsch'),
            ('fr', 'Français'),
            ('es', 'Español'),
            ('it', 'Italiano'),
            ('pt', 'Português'),
            ('ru', 'Русский'),
            ('ar', 'العربية'),
        ],
        default='en',
        blank=True,
        null=True,
        verbose_name='Tercih Edilen Dil'
    )
    
    preferred_country = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Tercih Edilen Ülke'
    )
    
    is_setup_completed = models.BooleanField(
        default=False,
        verbose_name='Kurulum Tamamlandı mı?'
    )

    # 📌 ÇAKIŞMAYI ÖNLEMEK İÇİN related_name EKLE
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="core_user_groups",
        related_query_name="core_user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="core_user_permissions",
        related_query_name="core_user",
    )

    class Meta:
        db_table = 'core_user'
        verbose_name = 'Kullanıcı'
        verbose_name_plural = 'Kullanıcılar'

    def __str__(self):
        return f"{self.username} ({self.get_full_name()})"


# ================== PERSON MODEL ==================
class Person(models.Model):
    """Canonical Kişi Modeli"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=20)  # MALE, FEMALE, OTHER
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_person'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


# ================== ATHLETE PROFILE ==================
class AthleteProfile(models.Model):
    """Sporcu Profili Modeli"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person = models.OneToOneField(Person, on_delete=models.CASCADE, related_name='athlete_profile')
    sport_context_ref = models.UUIDField(null=True, blank=True)
    is_para_athlete = models.BooleanField(default=False)
    classification = models.CharField(max_length=50, blank=True)
    level = models.CharField(max_length=50, blank=True)
    license_number = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_athleteprofile'

    def __str__(self):
        return f"{self.person.first_name} {self.person.last_name} - {self.level or 'Seviye Yok'}"


# ================== OUTBOX ==================
class Outbox(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Beklemede'
        SENT = 'SENT', 'Gönderildi'
        FAILED = 'FAILED', 'Başarısız'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    last_error = models.TextField(blank=True)

    class Meta:
        db_table = 'core_outbox'


# ================== ORGANIZATION ==================
class Organization(models.Model):
    """Organizasyon (Kulüp, Federasyon, Akademi, vb.)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, blank=True)  # CLUB, FEDERATION, ACADEMY, OTHER
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_organization'

    def __str__(self):
        return self.name


# ================== TEAM ==================
class Team(models.Model):
    """Takım (Organizasyon içinde)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='teams')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_team'

    def __str__(self):
        return f"{self.name} ({self.organization.name})"


# ================== ATHLETE EXTENDED ==================
class AthleteExtended(models.Model):
    """Sporcu ek bilgileri (görseldeki tüm alanlar)"""
    athlete = models.OneToOneField(AthleteProfile, on_delete=models.CASCADE, related_name='extended')
    
    # Fotoğraf
    photo = models.ImageField(upload_to='athlete_photos/', null=True, blank=True)
    
    # Branş, Kulüp, Akademi
    branch = models.CharField(max_length=100, blank=True)
    club = models.CharField(max_length=200, blank=True)
    academy = models.CharField(max_length=200, blank=True)
    
    # Yaş Grubu, Takım (metin), Boy, Kilo
    age_group = models.CharField(max_length=50, blank=True)
    team = models.CharField(max_length=100, blank=True)  # Metin olarak takım adı
    height_cm = models.IntegerField(null=True, blank=True)
    weight_kg = models.IntegerField(null=True, blank=True)
    
    # --- YENİ ALANLAR (Organizasyon ve Takım UUID referansları) ---
    organization_ref = models.UUIDField(null=True, blank=True)  # Organization ID
    team_ref = models.UUIDField(null=True, blank=True)          # Team ID (UUID)
    
    # İletişim Bilgileri
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    emergency_phone = models.CharField(max_length=20, blank=True)
    
    # Veli Bilgileri
    parent_name = models.CharField(max_length=200, blank=True)
    parent_phone = models.CharField(max_length=20, blank=True)
    parent_email = models.EmailField(blank=True)
    
    # Okul Bilgileri
    school_name = models.CharField(max_length=200, blank=True)
    school_class = models.CharField(max_length=50, blank=True)
    
    # Sağlık Bilgileri
    health_notes = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    medications = models.TextField(blank=True)
    
    # Fiziksel Donanım
    physical_notes = models.TextField(blank=True)
    
    # Uluslararası Bilgiler
    international_notes = models.TextField(blank=True)
    
    # Notlar
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_athleteextended'