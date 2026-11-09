import React, { useState, useEffect } from 'react';
import { api, authStorage } from './services/api';
import { UserSession } from './types';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { RankingsView } from './components/RankingsView';
import { WasteInputForm } from './components/WasteInputForm';
import { OfficerHistoryView } from './components/OfficerHistoryView';
import { AdminPanel } from './components/AdminPanel';
import { CeremonyModal } from './components/CeremonyModal';
import { RefreshCw, Leaf } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [ceremonyModalOpen, setCeremonyModalOpen] = useState<boolean>(false);

  // Check existing session
  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api.getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        authStorage.clear();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLoginSuccess = (loggedInUser: UserSession) => {
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-white p-1 border-2 border-emerald-500 shadow-xl shadow-emerald-700/20 flex items-center justify-center mb-3">
          <img src="/logo.png" alt="Logo Sispaling" className="w-full h-full object-contain animate-pulse" />
        </div>
        <p className="text-sm font-bold text-slate-700">EcoTrack Sispaling</p>
        <p className="text-xs text-slate-400">SMA Negeri 11 Maros</p>
      </div>
    );
  }

  // Not logged in -> Show Login View
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sticky Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenCeremonyModal={() => setCeremonyModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && <DashboardView />}

        {activeTab === 'rankings' && (
          <RankingsView onOpenCeremonyModal={() => setCeremonyModalOpen(true)} />
        )}

        {activeTab === 'input' && (
          <WasteInputForm
            user={user}
            onSuccess={() => {
              // Optionally stay or switch
            }}
          />
        )}

        {activeTab === 'history' && <OfficerHistoryView user={user} />}

        {activeTab === 'admin' && user.role === 'admin' && <AdminPanel />}
      </main>

      {/* Flag Ceremony Announcement Modal */}
      <CeremonyModal
        isOpen={ceremonyModalOpen}
        onClose={() => setCeremonyModalOpen(false)}
      />

      {/* Responsive School Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Logo Sispaling" className="w-5 h-5 object-contain" />
            <span className="font-bold text-slate-800">
              EcoTrack Sispaling • SMA Negeri 11 Maros
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Satuan: Jumlah per Biji</span>
            <span>•</span>
            <span>Senin - Jumat</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">Organik • Anorganik • B3</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
