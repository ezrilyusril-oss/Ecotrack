import React, { useState } from 'react';
import { api } from '../services/api';
import { UserSession } from '../types';
import {
  Leaf,
  Sprout,
  Trees,
  ShieldCheck,
  UserCheck,
  Eye,
  LogIn,
  Sparkles,
  AlertCircle,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [activeRoleTab, setActiveRoleTab] = useState<'guest' | 'petugas' | 'admin'>('guest');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loginAsGuest();
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Gagal masuk sebagai tamu');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Harap isi username dan password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.login(username.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Username atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/90 via-teal-50/50 to-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Floating Foliage / Leaves in the Background */}
      <div className="absolute top-6 left-8 text-emerald-300/40 animate-pulse pointer-events-none hidden sm:block">
        <Leaf className="w-16 h-16 -rotate-45" />
      </div>
      <div className="absolute top-28 left-20 text-teal-200/50 pointer-events-none hidden md:block">
        <Sprout className="w-10 h-10 rotate-12" />
      </div>
      <div className="absolute top-12 right-12 text-emerald-300/40 animate-pulse pointer-events-none hidden sm:block">
        <Leaf className="w-20 h-20 rotate-45" />
      </div>
      <div className="absolute top-36 right-24 text-teal-200/50 pointer-events-none hidden md:block">
        <Trees className="w-12 h-12 -rotate-12" />
      </div>
      <div className="absolute bottom-16 left-12 text-emerald-200/40 pointer-events-none hidden sm:block">
        <Leaf className="w-24 h-24 rotate-12" />
      </div>
      <div className="absolute bottom-10 right-14 text-emerald-200/40 pointer-events-none hidden sm:block">
        <Sprout className="w-20 h-20 -rotate-45" />
      </div>

      <div className="max-w-md w-full mx-auto space-y-6 relative z-10">
        {/* Header Logo with Botanical Elements */}
        <div className="text-center space-y-2">
          {/* Main Leaf & Logo Cluster */}
          <div className="relative inline-flex items-center justify-center mb-3">
            {/* Small flanking leaves */}
            <div className="absolute -left-7 top-4 text-emerald-500/80 -rotate-45 animate-pulse">
              <Sprout className="w-8 h-8" />
            </div>
            <div className="absolute -right-7 top-4 text-teal-600/80 rotate-45 animate-pulse">
              <Sprout className="w-8 h-8" />
            </div>

            {/* Central Official Logo Emblem */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white p-1.5 shadow-2xl shadow-emerald-700/25 border-2 border-emerald-500 ring-4 ring-emerald-200/80 flex items-center justify-center overflow-hidden hover:scale-105 transition-transform duration-300">
              <img
                src="/logo.png"
                alt="Logo Sispaling SMA Negeri 11 Maros"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full w-fit mx-auto">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gerakan Peduli & Berbudaya Lingkungan</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-600 rotate-180" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
            EcoTrack <span className="text-emerald-600">Sispaling</span>
          </h1>
          <p className="text-sm font-bold text-emerald-800 uppercase tracking-widest flex items-center justify-center gap-2">
            <span>🌿</span>
            <span>SMA Negeri 11 Maros</span>
            <span>🌿</span>
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Sistem Pencatatan Sampah Harian Kelas & Monitoring Kebersihan Sekolah
          </p>
        </div>

        {/* Main Card with Leaf Watermark */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-emerald-100 p-6 sm:p-8 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
          {/* Subtle Corner Leaf Watermark */}
          <Leaf className="w-32 h-32 text-emerald-50/70 -rotate-12 absolute -bottom-6 -right-6 pointer-events-none" />
          <Sprout className="w-20 h-20 text-emerald-50/50 rotate-45 absolute -top-4 -left-4 pointer-events-none" />

          {/* Role Selection Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveRoleTab('guest');
                setError(null);
              }}
              className={`py-2 px-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                activeRoleTab === 'guest'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>1. Tamu</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRoleTab('petugas');
                setError(null);
              }}
              className={`py-2 px-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                activeRoleTab === 'petugas'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>2. Petugas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRoleTab('admin');
                setError(null);
                setUsername('');
                setPassword('');
              }}
              className={`py-2 px-2 rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                activeRoleTab === 'admin'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3. Admin</span>
            </button>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: TAMU */}
          {activeRoleTab === 'guest' && (
            <div className="space-y-4 text-center py-2">
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl text-left space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Akses Terbuka untuk Seluruh Warga Sekolah</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tamu dapat langsung melihat ringkasan <strong>Dashboard</strong>, grafik harian & bulanan, serta{' '}
                  <strong>Peringkat Kelas Terbersih & Sampah Terbanyak</strong> tanpa perlu username maupun password.
                </p>
                <div className="pt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tamu tidak dapat menginput atau mengubah data apapun.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="text-sm">Memuat Dashboard...</span>
                ) : (
                  <>
                    <span>Masuk sebagai Tamu</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: PETUGAS INPUT */}
          {activeRoleTab === 'petugas' && (
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-slate-600">
                <p className="font-semibold text-teal-900 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                  Akun Petugas Anggota Sispaling
                </p>
                <p>
                  Akun dibuatkan langsung oleh Admin. Petugas bertugas menginput sampah kelas lain (tidak boleh menginput kelas sendiri).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username atau Email Petugas
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan username atau email petugas"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer text-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Memverifikasi...' : 'Masuk sebagai Petugas'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: ADMIN */}
          {activeRoleTab === 'admin' && (
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900">
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                  Akses Administrator Sispaling
                </p>
                <p className="text-slate-600">
                  Masuk dengan akun Administrator resmi untuk mengelola petugas, daftar kelas, rekapitulasi data, dan pengaturan sistem.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username atau Email Admin
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau email admin"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password Admin
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password admin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl shadow-md shadow-purple-700/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer text-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Memverifikasi...' : 'Masuk sebagai Admin'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info with leaf icons */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5 font-medium text-emerald-900">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>© 2026 Tim Sispaling SMA Negeri 11 Maros</span>
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          </p>
          <p className="text-[11px] text-slate-400">
            Organik • Anorganik • B3 | Satuan: Jumlah per Biji
          </p>
        </div>
      </div>
    </div>
  );
};
