from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Person, AthleteProfile, Organization, Team, AthleteExtended

# 📌 Özel User Admin (Users bölümünü admin panelinde gösterir)
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'preferred_language', 'is_setup_completed', 'is_staff')
    list_filter = ('preferred_language', 'is_setup_completed', 'is_staff', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Kullanıcı Tercihleri', {
            'fields': ('preferred_language', 'preferred_country', 'is_setup_completed'),
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Kullanıcı Tercihleri', {
            'fields': ('preferred_language', 'preferred_country', 'is_setup_completed'),
        }),
    )

# 📌 Diğer modeller (zaten varsa ekleme, yoksa oluştur)
@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'date_of_birth', 'gender')
    search_fields = ('first_name', 'last_name')

@admin.register(AthleteProfile)
class AthleteProfileAdmin(admin.ModelAdmin):
    list_display = ('person', 'level', 'license_number')
    search_fields = ('person__first_name', 'person__last_name')

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'is_active')
    search_fields = ('name',)

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization')
    search_fields = ('name',)

@admin.register(AthleteExtended)
class AthleteExtendedAdmin(admin.ModelAdmin):
    list_display = ('athlete',)
    search_fields = ('athlete__person__first_name', 'athlete__person__last_name')