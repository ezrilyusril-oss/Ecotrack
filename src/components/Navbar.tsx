import React from 'react';
import { UserSession } from '../types';
import {
  Leaf,
  LogOut,
  LayoutDashboard,
  Trophy,
  PlusCircle,
  History,
  ShieldCheck,
  UserCheck,
  User,
  Menu,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface NavbarProps {
  user: UserSession | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenCeremonyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenCeremonyModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['guest', 'petugas', 'admin'],
    },
    {
      id: 'rankings',
      label: 'Peringkat & Upacara',
      icon: Trophy,
      roles: ['guest', 'petugas', 'admin'],
    },
    {
      id: 'input',
      label: 'Input Sampah',
      icon: PlusCircle,
      roles: ['petugas', 'admin'],
    },
    {
      id: 'history',
      label: user?.role === 'admin' ? 'Data Input' : 'Riwayat Saya',
      icon: History,
      roles: ['petugas', 'admin'],
    },
    {
      id: 'admin',
      label: 'Panel Admin',
      icon: ShieldCheck,
      roles: ['admin'],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : item.roles.includes('guest')
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-11 h-11 rounded-full bg-white p-0.5 border-2 border-emerald-500 shadow-md shadow-emerald-700/15 flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo.png" alt="Logo Sispaling" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-emerald-950">
                  EcoTrack <span className="text-emerald-600">Sispaling</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                  Firebase Cloud
                </span>
              </div>
              <p className="text-xs font-medium text-emerald-700 tracking-wide">
                SMA Negeri 11 Maros
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User info & Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Quick ceremony button */}
            <button
              onClick={onOpenCeremonyModal}
              title="Buka Teks Pengumuman Upacara Hari Senin"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg transition-colors shadow-xs"
            >
              <span>🎙️ Upacara Senin</span>
            </button>

            {/* Role Badge */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : user.role === 'petugas'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {user.role === 'admin' ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  ) : user.role === 'petugas' ? (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span className="max-w-[120px] truncate font-semibold">
                    {user.role === 'admin'
                      ? 'Admin Sispaling'
                      : user.role === 'petugas'
                      ? `${user.nama} (${user.kelasAsal || '-'})`
                      : 'Tamu'}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  title="Keluar / Ganti Akun"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenCeremonyModal}
              className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-900 rounded-md"
            >
              🎙️ Upacara
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-emerald-50 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-emerald-100 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {user && (
            <div className="py-2 px-3 bg-emerald-50 rounded-lg flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-emerald-950">{user.nama}</p>
                <p className="text-[11px] text-emerald-700">
                  {user.role === 'admin'
                    ? 'Peran: Administrator (Akses Penuh)'
                    : user.role === 'petugas'
                    ? `Petugas Sispaling (Kelas Asal: ${user.kelasAsal})`
                    : 'Peran: Pengunjung Tamu (Hanya Lihat)'}
                </p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="text-xs text-rose-600 font-semibold px-2 py-1 hover:bg-rose-50 rounded"
              >
                Keluar
              </button>
            </div>
          )}

          <div className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'text-slate-700 hover:bg-emerald-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
