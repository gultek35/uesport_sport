import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AthleteList.css';

function AthleteList() {
  const [athletes, setAthletes] = useState([]);
  const [filteredAthletes, setFilteredAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrg, setFilterOrg] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [athletesRes, orgRes, teamRes] = await Promise.all([
          axios.get('/api/v1/core/athlete-profiles/'),
          axios.get('/api/v1/core/organizations/'),
          axios.get('/api/v1/core/teams/')
        ]);
        setAthletes(athletesRes.data || []);
        setFilteredAthletes(athletesRes.data || []);
        setOrganizations(orgRes.data || []);
        setTeams(teamRes.data || []);
        setLoading(false);
      } catch (err) {
        setError('Veriler yüklenirken hata oluştu.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Arama ve filtreleme
  useEffect(() => {
    let result = athletes;

    // Metin araması (ad, soyad, branş, kulüp)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(a =>
        (a.person?.first_name?.toLowerCase() || '').includes(term) ||
        (a.person?.last_name?.toLowerCase() || '').includes(term) ||
        (a.extended?.branch?.toLowerCase() || '').includes(term) ||
        (a.extended?.club?.toLowerCase() || '').includes(term)
      );
    }

    // Organizasyon filtresi
    if (filterOrg) {
      result = result.filter(a => a.extended?.organization_ref === filterOrg);
    }

    // Takım filtresi
    if (filterTeam) {
      result = result.filter(a => a.extended?.team_ref === filterTeam);
    }

    setFilteredAthletes(result);
  }, [searchTerm, filterOrg, filterTeam, athletes]);

  const handleDelete = async (id, name) => {
    if (window.confirm(`${name} adlı sporcuyu silmek istediğinize emin misiniz?`)) {
      try {
        await axios.delete(`/api/v1/core/athlete-profiles/${id}/`);
        setAthletes(athletes.filter(a => a.id !== id));
        setFilteredAthletes(filteredAthletes.filter(a => a.id !== id));
      } catch (err) {
        alert('Silme işlemi başarısız.');
      }
    }
  };

  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="list-container">
      <div className="list-header">
        <h2>🏃 Sporcu Listesi</h2>
        <Link to="/athlete/register" className="add-btn">+ Yeni Sporcu</Link>
      </div>

      {/* Arama ve Filtreleme */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="🔍 Ara (Ad, Soyad, Branş, Kulüp)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select value={filterOrg} onChange={(e) => setFilterOrg(e.target.value)} className="filter-select">
          <option value="">Tüm Organizasyonlar</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
        <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} className="filter-select">
          <option value="">Tüm Takımlar</option>
          {teams.map(team => (
            <option key={team.id} value={team.id}>{team.name}</option>
          ))}
        </select>
        <span className="result-count">{filteredAthletes.length} sporcu</span>
      </div>

      {/* Sporcu Tablosu */}
      <div className="table-wrapper">
        <table className="athlete-table">
          <thead>
            <tr>
              <th>Ad Soyad</th>
              <th>Branş</th>
              <th>Kulüp</th>
              <th>Organizasyon</th>
              <th>Takım</th>
              <th>Seviye</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredAthletes.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-row">Henüz sporcu kaydı bulunmuyor.</td>
              </tr>
            ) : (
              filteredAthletes.map((athlete) => {
                const orgName = organizations.find(o => o.id === athlete.extended?.organization_ref)?.name || '-';
                const teamName = teams.find(t => t.id === athlete.extended?.team_ref)?.name || '-';
                return (
                  <tr key={athlete.id}>
                    <td>{athlete.person?.first_name} {athlete.person?.last_name}</td>
                    <td>{athlete.extended?.branch || '-'}</td>
                    <td>{athlete.extended?.club || '-'}</td>
                    <td>{orgName}</td>
                    <td>{teamName}</td>
                    <td>{athlete.level || '-'}</td>
                    <td className="actions">
                      <Link to={`/athlete/${athlete.id}`} className="edit-btn">✏️ Düzenle</Link>
                      <button onClick={() => handleDelete(athlete.id, `${athlete.person?.first_name} ${athlete.person?.last_name}`)} className="delete-btn">🗑️ Sil</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AthleteList;