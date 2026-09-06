import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AthleteDetail.css';

function AthleteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: 'MALE',
    date_of_birth: '',
    branch: '',
    club: '',
    academy: '',
    age_group: '',
    team: '',
    height_cm: '',
    weight_kg: '',
    license_number: '',
    phone: '',
    email: '',
    address: '',
    emergency_phone: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    school_name: '',
    school_class: '',
    health_notes: '',
    allergies: '',
    medications: '',
    physical_notes: '',
    international_notes: '',
    notes: '',
    is_para_athlete: false,
    level: 'Elit',
    photo: null,
  });

  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const fetchAthlete = async () => {
      try {
        const response = await axios.get(`/api/v1/core/athlete-profiles/${id}/`);
        const data = response.data;
        const person = data.person || {};
        const extended = data.extended || {};
        setFormData({
          first_name: person.first_name || '',
          last_name: person.last_name || '',
          gender: person.gender || 'MALE',
          date_of_birth: person.date_of_birth || '',
          branch: extended.branch || '',
          club: extended.club || '',
          academy: extended.academy || '',
          age_group: extended.age_group || '',
          team: extended.team || '',
          height_cm: extended.height_cm || '',
          weight_kg: extended.weight_kg || '',
          license_number: data.license_number || '',
          phone: extended.phone || '',
          email: extended.email || '',
          address: extended.address || '',
          emergency_phone: extended.emergency_phone || '',
          parent_name: extended.parent_name || '',
          parent_phone: extended.parent_phone || '',
          parent_email: extended.parent_email || '',
          school_name: extended.school_name || '',
          school_class: extended.school_class || '',
          health_notes: extended.health_notes || '',
          allergies: extended.allergies || '',
          medications: extended.medications || '',
          physical_notes: extended.physical_notes || '',
          international_notes: extended.international_notes || '',
          notes: extended.notes || '',
          is_para_athlete: data.is_para_athlete || false,
          level: data.level || 'Elit',
          photo: null,
        });
        setLoading(false);
      } catch (err) {
        setMessage({ type: 'error', text: '❌ Sporcu bilgileri yüklenemedi.' });
        setLoading(false);
      }
    };
    fetchAthlete();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSectionSave = (section) => {
    alert(`${section} bölümü kaydedildi! (Demo)`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        person: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
        },
        is_para_athlete: formData.is_para_athlete,
        level: formData.level,
        license_number: formData.license_number,
        extended: {
          branch: formData.branch,
          club: formData.club,
          academy: formData.academy,
          age_group: formData.age_group,
          team: formData.team,
          height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          emergency_phone: formData.emergency_phone,
          parent_name: formData.parent_name,
          parent_phone: formData.parent_phone,
          parent_email: formData.parent_email,
          school_name: formData.school_name,
          school_class: formData.school_class,
          health_notes: formData.health_notes,
          allergies: formData.allergies,
          medications: formData.medications,
          physical_notes: formData.physical_notes,
          international_notes: formData.international_notes,
          notes: formData.notes,
        }
      };

      await axios.put(`/api/v1/core/athlete-profiles/${id}/`, payload);
      setMessage({
        type: 'success',
        text: `✅ Sporcu ${formData.first_name} ${formData.last_name} başarıyla güncellendi!`
      });
      setTimeout(() => navigate('/athletes'), 2000);
    } catch (err) {
      setMessage({
        type: 'error',
        text: '❌ Güncelleme başarısız: ' + (err.response?.data?.detail || err.message)
      });
    }
    setSaving(false);
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;

  return (
    <div className="detail-container">
      <div className="detail-header">
        <h2 className="page-title">✏️ Sporcu Düzenle</h2>
        <p className="page-subtitle">Sporcu bilgilerini güncelleyin. Değişiklikler anında kaydedilir.</p>
        <button className="back-btn" onClick={() => navigate('/athletes')}>← Sporcu Listesine Dön</button>
      </div>

      <form onSubmit={handleSubmit} className="detail-form">
        {/* 1. Temel Bilgiler */}
        <div className="form-section">
          <div className="section-header">
            <h3>1. Temel Bilgiler</h3>
            <button type="button" className="section-save-btn" onClick={() => handleSectionSave('Temel Bilgiler')}>Bu Bölümü Kaydet</button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Ad *</label>
              <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Soyad *</label>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cinsiyet *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="MALE">Erkek</option>
                <option value="FEMALE">Kadın</option>
                <option value="OTHER">Diğer</option>
              </select>
            </div>
            <div className="form-group">
              <label>Doğum Tarihi *</label>
              <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row three-col">
            <div className="form-group">
              <label>Branş</label>
              <input type="text" name="branch" value={formData.branch} onChange={handleChange} placeholder="örn: Futbol" />
            </div>
            <div className="form-group">
              <label>Kulüp</label>
              <input type="text" name="club" value={formData.club} onChange={handleChange} placeholder="Kulüp adı (opsiyonel)" />
            </div>
            <div className="form-group">
              <label>Akademi</label>
              <input type="text" name="academy" value={formData.academy} onChange={handleChange} placeholder="Akademi adı" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Yaş Grubu</label>
              <input type="text" name="age_group" value={formData.age_group} onChange={handleChange} placeholder="örn: U15" />
            </div>
            <div className="form-group">
              <label>Takım</label>
              <input type="text" name="team" value={formData.team} onChange={handleChange} placeholder="Takım adı" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Boy (cm)</label>
              <input type="number" name="height_cm" value={formData.height_cm} onChange={handleChange} placeholder="örn: 172" />
            </div>
            <div className="form-group">
              <label>Kilo (kg)</label>
              <input type="number" name="weight_kg" value={formData.weight_kg} onChange={handleChange} placeholder="örn: 62" />
            </div>
          </div>
          {/* Fotoğraf */}
          <div className="form-row">
            <div className="form-group photo-group">
              <label>Fotoğraf</label>
              <div className="photo-upload">
                {photoPreview ? (
                  <img src={photoPreview} alt="Önizleme" className="photo-preview" />
                ) : (
                  <div className="photo-placeholder">Fotoğraf yüklenmedi</div>
                )}
                <div className="photo-buttons">
                  <button type="button" className="photo-btn" onClick={() => document.getElementById('photo-upload').click()}>📷 Fotoğraf Yükle</button>
                  <button type="button" className="photo-btn">📸 Fotoğraf Çek</button>
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} id="photo-upload" />
                <span className="photo-hint">JPG, PNG formatında, maksimum 5MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Lisans Bilgileri */}
        <div className="form-section">
          <div className="section-header">
            <h3>2. Lisans Bilgileri</h3>
            <button type="button" className="section-save-btn" onClick={() => handleSectionSave('Lisans Bilgileri')}>Bu Bölümü Kaydet</button>
          </div>
          <div className="form-group">
            <label>Lisans Numarası</label>
            <input type="text" name="license_number" value={formData.license_number} onChange={handleChange} />
          </div>
        </div>

        {/* 3. İletişim Bilgileri */}
        <div className="form-section">
          <div className="section-header">
            <h3>3. İletişim Bilgileri</h3>
            <button type="button" className="section-save-btn" onClick={() => handleSectionSave('İletişim Bilgileri')}>Bu Bölümü Kaydet</button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Telefon</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>E-posta</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Adres</label>
            <textarea name="address" value={formData.address} onChange={handleChange} rows="2"></textarea>
          </div>
          <div className="form-group">
            <label>Acil Durum Telefonu</label>
            <input type="tel" name="emergency_phone" value={formData.emergency_phone} onChange={handleChange} />
          </div>
        </div>

        {/* 4. Veli Bilgileri */}
        <div className="form-section">
          <div className="section-header">
            <h3>4. Veli Bilgileri</h3>
            <button type="button" className="section-save-btn" onClick={() => handleSectionSave('Veli Bilgileri')}>Bu Bölümü Kaydet</button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Veli Adı Soyadı</label>
              <input type="text" name="parent_name" value={formData.parent_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Veli Telefon</label>
              <input type="tel" name="parent_phone" value={formData.parent_phone} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Veli E-posta</label>
            <input type="email" name="parent_email" value={formData.parent_email} onChange={handleChange} />
          </div>
        </div>

        {/* 5. Okul Bilgileri */}
        <div className="form-section">
          <div className="section-header">
            <h3>5. Okul Bilgileri</h3>
            <button type="button" className="section-save-btn" onClick={() => handleSectionSave('Okul Bilgileri')}>Bu Bölümü Kaydet</button>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Okul Adı</label>
              <input type="text" name="school_name" value={formData.school_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Sınıf</label>
              <input type="text" name="school_class" value={formData.school_class} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* 6. Sağlık Bilgileri */}
        <div className="form-section">
          <div className="section-header">
            <h3>6. Sağlık Bilgileri</h3>
            <button type="button" className="section-save-btn" onClick={() => handleSectionSave('Sağlık Bilgileri')}>Bu Bölümü Kaydet</button>
          </div>
          <div className="form-group">
            <label>Sağlık Notları</label>
            <textarea name="health_notes" value={formData.health_notes} onChange={handleChange} rows="2"></textarea>
          </div>
          <div className="form-group">
            <label>Alerjiler</label>
            <textarea name="allergies" value={formData.allergies} onChange={handleChange} rows="2"></textarea>
          </div>
          <div className="form-group">
            <label>Düzenli Kullanılan İlaçlar</label>
            <textarea name="medications" value={formData.medications} onChange={handleChange} rows="2"></textarea>
          </div>
        </div>

        {/* 7. Fiziksel Donanım */}
        <div className="form-section">
          <div className="section-header">
            <h3>7. Fiziksel Donanım</h3>
            <button type="button" className="section-save-btn" onClick={() => handleSectionSave('Fiziksel Donanım')}>Bu Bölümü Kaydet</button>
          </div>
          <div className="form-group">
            <label>Fiziksel Donanım Notları</label>
            <textarea name="physical_notes" value={formData.physical_notes} onChange={handleChange} rows="2"></textarea>
          </div>
        </div>

        {/* 8. Uluslararası Bilgiler */}
        <div className="form-section">
          <div className="section-header">
            <h3>8. Uluslararası Bilgiler</h3>
            <button type="button" className="section-save-btn" onClick={() => handleSectionSave('Uluslararası Bilgiler')}>Bu Bölümü Kaydet</button>
          </div>
          <div className="form-group">
            <label>Uluslararası Notlar</label>
            <textarea name="international_notes" value={formData.international_notes} onChange={handleChange} rows="2"></textarea>
          </div>
        </div>

        {/* 9. Notlar */}
        <div className="form-section">
          <div className="section-header">
            <h3>9. Notlar</h3>
            <button type="button" className="section-save-btn" onClick={() => handleSectionSave('Notlar')}>Bu Bölümü Kaydet</button>
          </div>
          <div className="form-group">
            <label>Genel Notlar</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3"></textarea>
          </div>
        </div>

        {/* 10. Kayıt Bilgilendirme */}
        <div className="form-section">
          <div className="section-header">
            <h3>10. Kayıt Bilgilendirme</h3>
            <button type="button" className="section-save-btn" onClick={() => handleSectionSave('Kayıt Bilgilendirme')}>Bu Bölümü Kaydet</button>
          </div>
          <p className="info-text">
            Girdiğiniz her bölüm bilgisi kaydedilecektir. Eksik bilgiler daha sonra tamamlanabilir.
          </p>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving} className="submit-btn">
            {saving ? 'Güncelleniyor...' : '💾 Sporcu Güncelle'}
          </button>
        </div>

        {message && <div className={`message ${message.type}`}>{message.text}</div>}
      </form>
    </div>
  );
}

export default AthleteDetail;