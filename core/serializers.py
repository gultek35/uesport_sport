from rest_framework import serializers
from .models import Person, AthleteProfile, AthleteExtended, Organization, Team

class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['id', 'first_name', 'last_name', 'date_of_birth', 'gender']

class AthleteExtendedSerializer(serializers.ModelSerializer):
    class Meta:
        model = AthleteExtended
        exclude = ['id', 'athlete', 'created_at', 'updated_at']

class AthleteProfileSerializer(serializers.ModelSerializer):
    person = PersonSerializer()
    extended = AthleteExtendedSerializer(required=False)

    class Meta:
        model = AthleteProfile
        fields = ['id', 'person', 'sport_context_ref', 'is_para_athlete', 'classification', 'level', 'license_number', 'extended']

    def create(self, validated_data):
        person_data = validated_data.pop('person')
        extended_data = validated_data.pop('extended', {})
        person = Person.objects.create(**person_data)
        athlete = AthleteProfile.objects.create(person=person, **validated_data)
        if extended_data:
            AthleteExtended.objects.create(athlete=athlete, **extended_data)
        return athlete

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

class TeamSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)

    class Meta:
        model = Team
        fields = '__all__'