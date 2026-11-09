import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SchoolClass, WasteInput } from '../types';
import { exportInputsToExcel, exportRankingsToExcel, triggerPrintReport } from '../utils/exportUtils';
import { ConfirmModal } from './ConfirmModal';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  KeyRound,
  Trash2,
  Edit,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Printer,
  RotateCcw,
  RefreshCw,
  Plus,
  Lock
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'petugas' | 'kelas' | 'ekspor' | 'reset'>('petugas');

  // Petugas state
  const [petugasList, setPetugasList] = useState<any[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newKelasAsal, setNewKelasAsal] = useState('');
  const [petugasLoading, setPetugasLoading] = useState(false);
  const [petugasMsg, setPetugasMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Petugas Modal
  const [editingPetugas, setEditingPetugas] = useState<any | null>(null);
  const [editPetugasNama, setEditPetugasNama] = useState('');
  const [editPetugasKelasAsal, setEditPetugasKelasAsal] = useState('');
  const [editPetugasNewPassword, setEditPetugasNewPassword] = useState('');

  // Delete Petugas Modal
  const [deletePetugasTarget, setDeletePetugasTarget] = useState<{ id: string; nama: string } | null>(null);
  const [deletePetugasLoading, setDeletePetugasLoading] = useState(false);
  const [deletePetugasError, setDeletePetugasError] = useState<string | null>(null);

  // Kelas state
  const [classList, setClassList] = useState<SchoolClass[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTingkat, setNewClassTingkat] = useState<'X' | 'XI' | 'XII'>('X');
  const [newClassWali, setNewClassWali] = useState('');
  const [classLoading, setClassLoading] = useState(false);
  const [classMsg, setClassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit Kelas Modal
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [editClassName, setEditClassName] = useState('');
  const [editClassTingkat, setEditClassTingkat] = useState<'X' | 'XI' | 'XII'>('X');

  // Delete Kelas Modal
  const [deleteClassTarget, setDeleteClassTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteClassLoading, setDeleteClassLoading] = useState(false);
  const [deleteClassError, setDeleteClassError] = useState<string | null>(null);

  // Reset semester state
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [targetSemester, setTargetSemester] = useState('Genap');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetFinalConfirm, setShowResetFinalConfirm] = useState(false);

  // Export feedback state
  const [exportMsg, setExportMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin password change state
  const [oldAdminPass, setOldAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [users, classes] = await Promise.all([api.getUsers(), api.getClasses()]);
      setPetugasList(users.filter((u: any) => u.role === 'petugas'));
      setClassList(classes);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- PETUGAS HANDLERS ---
  const handleCreatePetugas = async (e: React.FormEvent) => {
    e.preventDefault();
    setPetugasMsg(null);
    if (!newUsername.trim() || !newPassword.trim() || !newNama.trim() || !newKelasAsal.trim()) {
      setPetugasMsg({ type: 'error', text: 'Semua kolom wajib diisi lengkap' });
      return;
    }

    setPetugasLoading(true);
    try {
      await api.createUser({
        username: newUsername.trim(),
        password: newPassword.trim(),
        nama: newNama.trim(),
        kelasAsal: newKelasAsal.trim(),
      });
      setPetugasMsg({ type: 'success', text: `Akun petugas ${newNama} berhasil dibuat!` });
      setNewUsername('');
      setNewPassword('');
      setNewNama('');
      setNewKelasAsal('');
      fetchData();
    } catch (err: any) {
      setPetugasMsg({ type: 'error', text: err.message || 'Gagal membuat petugas' });
    } finally {
      setPetugasLoading(false);
    }
  };

  const handleUpdatePetugas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPetugas) return;
    try {
      await api.updateUser(editingPetugas.id, {
        nama: editPetugasNama,
        kelasAsal: editPetugasKelasAsal,
        password: editPetugasNewPassword ? editPetugasNewPassword : undefined,
      });
      setEditingPetugas(null);
      setPetugasMsg({ type: 'success', text: `Data petugas ${editPetugasNama} berhasil diperbarui` });
      fetchData();
    } catch (err: any) {
      setPetugasMsg({ type: 'error', text: err.message || 'Gagal mengubah data petugas' });
    }
  };

  const promptDeletePetugas = (id: string, nama: string) => {
    setDeletePetugasError(null);
    setDeletePetugasTarget({ id, nama });
  };

  const handleConfirmDeletePetugas = async () => {
    if (!deletePetugasTarget) return;
    setDeletePetugasLoading(true);
    setDeletePetugasError(null);
    try {
      await api.deleteUser(deletePetugasTarget.id);
      setPetugasMsg({ type: 'success', text: `Akun petugas "${deletePetugasTarget.nama}" berhasil dihapus` });
      setDeletePetugasTarget(null);
      fetchData();
    } catch (err: any) {
      setDeletePetugasError(err.message || 'Gagal menghapus akun petugas');
    } finally {
      setDeletePetugasLoading(false);
    }
  };

  // --- KELAS HANDLERS ---
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassMsg(null);
    if (!newClassName.trim()) {
      setClassMsg({ type: 'error', text: 'Nama kelas wajib diisi' });
      return;
    }

    setClassLoading(true);
    try {
      await api.createClass({
        name: newClassName.trim(),
        tingkat: newClassTingkat,
        waliKelas: newClassWali.trim(),
        jumlahSiswa: 36,
      });
      setClassMsg({ type: 'success', text: `Kelas ${newClassName} berhasil ditambahkan!` });
      setNewClassName('');
      setNewClassWali('');
      fetchData();
    } catch (err: any) {
      setClassMsg({ type: 'error', text: err.message || 'Gagal membuat kelas' });
    } finally {
      setClassLoading(false);
    }
  };

  const handleUpdateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    try {
      await api.updateClass(editingClass.id, {
        name: editClassName.trim(),
        tingkat: editClassTingkat,
      });
      setEditingClass(null);
      setClassMsg({ type: 'success', text: `Data kelas ${editClassName} berhasil diperbarui` });
      fetchData();
    } catch (err: any) {
      setClassMsg({ type: 'error', text: err.message || 'Gagal memperbarui kelas' });
    }
  };

  const promptDeleteClass = (id: string, name: string) => {
    setDeleteClassError(null);
    setDeleteClassTarget({ id, name });
  };

  const handleConfirmDeleteClass = async () => {
    if (!deleteClassTarget) return;
    setDeleteClassLoading(true);
    setDeleteClassError(null);
    try {
      await api.deleteClass(deleteClassTarget.id);
      setClassMsg({ type: 'success', text: `Kelas "${deleteClassTarget.name}" berhasil dihapus` });
      setDeleteClassTarget(null);
      fetchData();
    } catch (err: any) {
      setDeleteClassError(err.message || 'Gagal menghapus kelas');
    } finally {
      setDeleteClassLoading(false);
    }
  };

  // --- EXPORT HANDLERS ---
  const handleExportAllToExcel = async () => {
    setExportMsg(null);
    try {
      const inputs = await api.getInputs();
      exportInputsToExcel(inputs, `Rekap_Lengkap_Sampah_SMAN11Maros_${new Date().toISOString().split('T')[0]}.xlsx`);
      setExportMsg({ type: 'success', text: 'Berkas Excel berhasil diekspor dan diunduh.' });
    } catch (err: any) {
      setExportMsg({ type: 'error', text: err.message || 'Gagal mengekspor data ke Excel' });
    }
  };

  const handlePrintFullReport = async () => {
    setExportMsg(null);
    try {
      const [inputs, stats] = await Promise.all([api.getInputs(), api.getDashboardStats()]);
      const rows = inputs
        .map(
          (item, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>${item.tanggal}</td>
          <td><strong>${item.kelasName}</strong></td>
          <td class="text-right">${item.organik}</td>
          <td class="text-right">${item.anorganik}</td>
          <td class="text-right">${item.b3}</td>
          <td class="text-right"><strong>${item.total}</strong></td>
          <td>${item.petugasName}</td>
          <td>${item.catatan || '-'}</td>
        </tr>
      `
        )
        .join('');

      const content = `
        <h3 style="text-align: center; margin-bottom: 5px;">REKAPITULASI RESMI PENCATATAN SAMPAH KELAS</h3>
        <p style="text-align: center; margin-top: 0; color: #64748b; font-size: 13px;">
          Total Sampah Terkumpul: <strong>${stats.summary.totalSampah} biji</strong> • Total Transaksi: <strong>${stats.summary.totalTransaksi}</strong>
        </p>
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 12%;">Tanggal</th>
              <th style="width: 15%;">Kelas</th>
              <th style="width: 10%;">Organik</th>
              <th style="width: 10%;">Anorganik</th>
              <th style="width: 10%;">B3</th>
              <th style="width: 12%;">Total (Biji)</th>
              <th style="width: 13%;">Petugas</th>
              <th style="width: 13%;">Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;

      triggerPrintReport('Laporan_Resmi_Sampah_SMAN11Maros', content);
      setExportMsg({ type: 'success', text: 'Pratinjau cetak PDF laporan resmi berhasil dibuka.' });
    } catch (err: any) {
      setExportMsg({ type: 'error', text: err.message || 'Gagal mencetak laporan' });
    }
  };

  // --- RESET SEMESTER HANDLER ---
  const handleResetSemesterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg(null);

    if (resetConfirmInput !== 'RESET DATA SEMESTER') {
      setResetMsg({
        type: 'error',
        text: 'Konfirmasi gagal: Harap ketik "RESET DATA SEMESTER" dengan tepat (huruf besar).',
      });
      return;
    }

    setShowResetFinalConfirm(true);
  };

  const handleExecuteReset = async () => {
    setResetLoading(true);
    setResetMsg(null);
    try {
      const res = await api.resetSemester(resetConfirmInput, targetSemester);
      setResetMsg({ type: 'success', text: res.message });
      setResetConfirmInput('');
      setShowResetFinalConfirm(false);
      fetchData();
    } catch (err: any) {
      setResetMsg({ type: 'error', text: err.message || 'Gagal mereset semester' });
    } finally {
      setResetLoading(false);
    }
  };

  // --- ADMIN PASSWORD CHANGE HANDLER ---
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (!oldAdminPass || !newAdminPass) {
      setPassMsg({ type: 'error', text: 'Password lama dan baru wajib diisi' });
      return;
    }
    setPassLoading(true);
    try {
      const res = await api.changeAdminPassword(oldAdminPass, newAdminPass);
      setPassMsg({ type: 'success', text: res.message });
      setOldAdminPass('');
      setNewAdminPass('');
    } catch (err: any) {
      setPassMsg({ type: 'error', text: err.message || 'Gagal mengubah password' });
    } finally {
      setPassLoading(false);
    }
  };


  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-800 rounded-2xl">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Panel Kelola Administrator
            </h2>
            <p className="text-xs text-slate-500">
              Akses penuh Tim Pembina Sispaling SMA Negeri 11 Maros (Username: sispaling26)
            </p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-2xl border border-slate-200 text-xs font-bold shadow-xs">
        <button
          onClick={() => setActiveTab('petugas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'petugas'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Kelola Akun Petugas ({petugasList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('kelas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'kelas'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Kelola Daftar Kelas ({classList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ekspor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'ekspor'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ekspor Excel & PDF</span>
        </button>

        <button
          onClick={() => setActiveTab('reset')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'reset'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Semester & Sandi</span>
        </button>
      </div>

      {/* TAB 1: KELOLA PETUGAS */}
      {activeTab === 'petugas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Petugas Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserPlus className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-sm">Buat Akun Petugas Baru</h3>
            </div>

            <p className="text-xs text-slate-500">
              Tidak ada fitur daftar sendiri. Admin membuatkan akun resmi untuk anggota Sispaling.
            </p>

            {petugasMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  petugasMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {petugasMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{petugasMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreatePetugas} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rahmat Hidayat"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kelas Asal Siswa *
                </label>
                <select
                  required
                  value={newKelasAsal}
                  onChange={(e) => setNewKelasAsal(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  <option value="" disabled>-- Pilih Kelas Asal Petugas --</option>
                  {classList.map((c) => (
                    <option key={c.id} value={c.name}>
                      Kelas {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Kelas asal ini otomatis dilarang diinput oleh petugas bersangkutan.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: rahmat_sispaling"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password Awal *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Password aman"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Disimpan dengan hashing ber-salt (aman).</p>
              </div>

              <button
                type="submit"
                disabled={petugasLoading}
                className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
              >
                {petugasLoading ? 'Memproses...' : '+ Tambahkan Petugas'}
              </button>
            </form>
          </div>

          {/* Petugas Table List */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">Daftar Akun Petugas Aktif</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Total: {petugasList.length} Petugas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Nama Petugas</th>
                    <th className="py-2.5 px-3">Username</th>
                    <th className="py-2.5 px-3">Kelas Asal (Terkunci)</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {petugasList.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-800">{p.nama}</td>
                      <td className="py-3 px-3 font-mono text-purple-700">{p.username}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-semibold text-[11px]">
                          Kelas {p.kelasAsal || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingPetugas(p);
                            setEditPetugasNama(p.nama);
                            setEditPetugasKelasAsal(p.kelasAsal || '');
                            setEditPetugasNewPassword('');
                          }}
                          className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition mr-1"
                          title="Edit petugas"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => promptDeletePetugas(p.id, p.nama)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus petugas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA KELAS */}
      {activeTab === 'kelas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Class Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-slate-900 text-sm">Tambah Kelas Baru</h3>
            </div>

            {classMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  classMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {classMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{classMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Kelas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: X-6 atau XI-Bahasa"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tingkat *
                </label>
                <select
                  value={newClassTingkat}
                  onChange={(e) => setNewClassTingkat(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                >
                  <option value="X">Kelas X</option>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Wali Kelas (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Nama Wali Kelas"
                  value={newClassWali}
                  onChange={(e) => setNewClassWali(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={classLoading}
                className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
              >
                {classLoading ? 'Menyimpan...' : '+ Tambahkan Kelas'}
              </button>
            </form>
          </div>

          {/* Classes Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">Daftar Kelas SMA Negeri 11 Maros</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {classList.length} Kelas Terdaftar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {classList.map((cls) => (
                <div
                  key={cls.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">Kelas {cls.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                        Tingkat {cls.tingkat}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Rata-rata ~36 siswa per kelas
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingClass(cls);
                        setEditClassName(cls.name);
                        setEditClassTingkat(cls.tingkat);
                      }}
                      className="p-1.5 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
                      title="Edit nama kelas"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => promptDeleteClass(cls.id, cls.name)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus kelas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EKSPOR REKAP DATA (EXCEL & PDF) */}
      {activeTab === 'ekspor' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Ekspor Rekapitulasi Data Sampah ke Excel & PDF
              </h3>
              <p className="text-xs text-slate-500">
                Unduh lembar kerja resmi atau cetak laporan berkop surat SMA Negeri 11 Maros
              </p>
            </div>
          </div>

          {exportMsg && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                exportMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {exportMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{exportMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export 1: Excel */}
            <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <span>1. Ekspor Lembar Kerja Excel (.xlsx)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Menghasilkan berkas Excel lengkap berisi data tanggal, kelas, rincian per biji (Organik, Anorganik, B3), total sampah, petugas input, dan catatan lapangan.
              </p>
              <button
                onClick={handleExportAllToExcel}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh Berkas Excel (.xlsx)</span>
              </button>
            </div>

            {/* Export 2: PDF / Print */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Printer className="w-5 h-5 text-slate-700" />
                <span>2. Cetak Dokumen Resmi / Simpan PDF</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Membuka pratinjau cetak resmi dengan Kop Surat Pemerintah Provinsi Sulawesi Selatan, Dinas Pendidikan, SMA Negeri 11 Maros, dan kolom tanda tangan Pembina Sispaling.
              </p>
              <button
                onClick={handlePrintFullReport}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Pratinjau Dokumen PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESET SEMESTER & GANTI PASSWORD */}
      {activeTab === 'reset' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Reset Data Semester (Strict Double Confirmation) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-rose-100 text-rose-900 font-bold">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Reset Data Sampah per Semester</span>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2">
              <p className="font-bold">⚠️ Perhatian Sangat Penting:</p>
              <p className="leading-relaxed">
                Fitur ini akan menghapus seluruh catatan sampah transaksi semester ini agar siap dipakai untuk semester berikutnya.
              </p>
              <p className="font-semibold text-rose-900">
                Sangat disarankan untuk mengekspor rekap data ke Excel terlebih dahulu sebelum melakukan reset!
              </p>
              <p className="text-[11px] text-slate-500">
                *Daftar kelas dan akun petugas tetap dipertahankan aman.
              </p>
            </div>

            {resetMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  resetMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {resetMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{resetMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleResetSemesterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Semester Baru:
                </label>
                <select
                  value={targetSemester}
                  onChange={(e) => setTargetSemester(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Ganjil">Semester Ganjil</option>
                  <option value="Genap">Semester Genap</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ketik Teks Konfirmasi Ganda:
                </label>
                <input
                  type="text"
                  required
                  placeholder='Ketik persis: "RESET DATA SEMESTER"'
                  value={resetConfirmInput}
                  onChange={(e) => setResetConfirmInput(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-rose-300 rounded-xl font-mono text-rose-900 font-bold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExportAllToExcel}
                  className="flex-1 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl transition"
                >
                  📥 Ekspor Dulu
                </button>
                <button
                  type="submit"
                  disabled={resetLoading || resetConfirmInput !== 'RESET DATA SEMESTER'}
                  className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-40"
                >
                  {resetLoading ? 'Mereset...' : 'Lakukan Reset Data'}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Ubah Password Akun Admin sispaling26 */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-purple-100 text-purple-900 font-bold">
              <KeyRound className="w-5 h-5 text-purple-600" />
              <span>Ganti Password Admin (sispaling26)</span>
            </div>

            <p className="text-xs text-slate-500">
              Perbarui kata sandi login akun administrator utama untuk keamanan data Sispaling.
            </p>

            {passMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  passMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {passMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangeAdminPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password Lama *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Password lama"
                  value={oldAdminPass}
                  onChange={(e) => setOldAdminPass(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password Baru *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Password baru"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
              >
                {passLoading ? 'Menyimpan...' : 'Perbarui Password Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PETUGAS MODAL */}
      {editingPetugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-purple-300" />
                <h3 className="font-bold text-sm">Edit Data Petugas ({editingPetugas.username})</h3>
              </div>
              <button
                onClick={() => setEditingPetugas(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePetugas} className="p-6 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Petugas
                </label>
                <input
                  type="text"
                  required
                  value={editPetugasNama}
                  onChange={(e) => setEditPetugasNama(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kelas Asal
                </label>
                <select
                  value={editPetugasKelasAsal}
                  onChange={(e) => setEditPetugasKelasAsal(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  {classList.map((c) => (
                    <option key={c.id} value={c.name}>
                      Kelas {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reset Password Baru (Kosongkan jika tidak diubah)
                </label>
                <input
                  type="password"
                  placeholder="Ketik password baru..."
                  value={editPetugasNewPassword}
                  onChange={(e) => setEditPetugasNewPassword(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPetugas(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-sm transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT KELAS MODAL */}
      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-300" />
                <h3 className="font-bold text-sm">Edit Kelas</h3>
              </div>
              <button
                onClick={() => setEditingClass(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClass} className="p-6 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  required
                  value={editClassName}
                  onChange={(e) => setEditClassName(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tingkat
                </label>
                <select
                  value={editClassTingkat}
                  onChange={(e) => setEditClassTingkat(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="X">Kelas X</option>
                  <option value="XI">Kelas XI</option>
                  <option value="XII">Kelas XII</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingClass(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white rounded-xl shadow-sm transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE PETUGAS MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletePetugasTarget)}
        title="Hapus Akun Petugas"
        message={`Apakah Anda yakin ingin menghapus akun petugas "${deletePetugasTarget?.nama}"? Akun ini tidak akan dapat login lagi ke sistem.`}
        confirmText="Hapus Akun"
        confirmVariant="danger"
        isLoading={deletePetugasLoading}
        errorMessage={deletePetugasError}
        onConfirm={handleConfirmDeletePetugas}
        onClose={() => {
          if (!deletePetugasLoading) {
            setDeletePetugasTarget(null);
            setDeletePetugasError(null);
          }
        }}
      />

      {/* CONFIRM DELETE KELAS MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteClassTarget)}
        title="Hapus Kelas"
        message={`Apakah Anda yakin ingin menghapus kelas "${deleteClassTarget?.name}"? Data catatan input sampah yang pernah terhubung ke kelas ini mungkin terpengaruh.`}
        confirmText="Hapus Kelas"
        confirmVariant="danger"
        isLoading={deleteClassLoading}
        errorMessage={deleteClassError}
        onConfirm={handleConfirmDeleteClass}
        onClose={() => {
          if (!deleteClassLoading) {
            setDeleteClassTarget(null);
            setDeleteClassError(null);
          }
        }}
      />

      {/* CONFIRM RESET SEMESTER MODAL */}
      <ConfirmModal
        isOpen={showResetFinalConfirm}
        title="Konfirmasi Terakhir: Reset Data Semester"
        message={`PERINGATAN RESMI: Seluruh data transaksi catatan sampah semester ini akan dibersihkan permanen dari Cloud Firestore untuk memasuki Semester ${targetSemester}. Pastikan Anda telah mengunduh rekap Excel sebelumnya.`}
        confirmText="Ya, Bersihkan Data Semester"
        confirmVariant="danger"
        isLoading={resetLoading}
        errorMessage={resetMsg?.type === 'error' ? resetMsg.text : null}
        onConfirm={handleExecuteReset}
        onClose={() => {
          if (!resetLoading) {
            setShowResetFinalConfirm(false);
          }
        }}
      />
    </div>
  );
};
