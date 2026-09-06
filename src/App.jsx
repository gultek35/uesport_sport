import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import Dashboard from './pages/Dashboard';
import AthleteRegister from './pages/AthleteRegister';
import AthleteDetail from './pages/AthleteDetail';
import AthleteList from './pages/AthleteList';
import AthletesPage from './pages/AthletesPage';
import TestPlanning from './pages/TestPlanning';
import TestExecution from './pages/TestExecution';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';
import Reports from './pages/Reports';
import './App.css';

// Eksik sayfalar için geçici placeholder bileşenler
const OrganizationsPlaceholder = () => <div>Organizasyon Sayfası (Yapım Aşamasında)</div>;
const SessionsPlaceholder = () => <div>Oturum Sayfası (Yapım Aşamasında)</div>;
const FormulaPlaceholder = () => <div>Formül Motoru (Yapım Aşamasında)</div>;
const NormPlaceholder = () => <div>Norm Motoru (Yapım Aşamasında)</div>;
const RankingPlaceholder = () => <div>Sıralama (Yapım Aşamasında)</div>;
const ScoutPlaceholder = () => <div>Scout (Yapım Aşamasında)</div>;
const ProjectionPlaceholder = () => <div>Yetenek Projeksiyonu (Yapım Aşamasında)</div>;
const RiskPlaceholder = () => <div>Risk Analizi (Yapım Aşamasında)</div>;
const EnvironmentPlaceholder = () => <div>Çevresel Faktörler (Yapım Aşamasında)</div>;
const SettingsPlaceholder = () => <div>Ayarlar (Yapım Aşamasında)</div>;

// 📌 Korumalı Route Bileşeni (Token kontrolü)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 📌 HERKESE AÇIK SAYFALAR */}
        <Route path="/login" element={<Login />} />
        <Route path="/setup" element={<SetupWizard />} />

        {/* 📌 KORUMALI SAYFALAR (Token gerekli) */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/athlete/register" element={
          <ProtectedRoute>
            <AthleteRegister />
          </ProtectedRoute>
        } />
        <Route path="/athlete/:id" element={
          <ProtectedRoute>
            <AthleteDetail />
          </ProtectedRoute>
        } />
        <Route path="/athletes" element={
          <ProtectedRoute>
            <AthletesPage />
          </ProtectedRoute>
        } />
        <Route path="/planning" element={
          <ProtectedRoute>
            <TestPlanning />
          </ProtectedRoute>
        } />
        <Route path="/execution" element={
          <ProtectedRoute>
            <TestExecution />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />

        {/* EKSİK OLAN ROTALAR (Placeholder) */}
        <Route path="/organizations" element={<OrganizationsPlaceholder />} />
        <Route path="/sessions" element={<SessionsPlaceholder />} />
        <Route path="/formula" element={<FormulaPlaceholder />} />
        <Route path="/norm" element={<NormPlaceholder />} />
        <Route path="/ranking" element={<RankingPlaceholder />} />
        <Route path="/scout" element={<ScoutPlaceholder />} />
        <Route path="/projection" element={<ProjectionPlaceholder />} />
        <Route path="/risk" element={<RiskPlaceholder />} />
        <Route path="/environment" element={<EnvironmentPlaceholder />} />
        <Route path="/settings" element={<SettingsPlaceholder />} />

        {/* 📌 TANIMSIZ SAYFALAR İÇİN 404 */}
        <Route path="*" element={<div style={{padding: '50px', textAlign: 'center'}}><h1>404 - Sayfa Bulunamadı</h1><p>Aradığınız sayfa mevcut değil.</p><a href="/login">Giriş Sayfasına Dön</a></div>} />
      </Routes>
    </Router>
  );
}

export default App;