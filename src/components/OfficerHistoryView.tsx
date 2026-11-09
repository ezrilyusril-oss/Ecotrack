import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { WasteInput, UserSession, SchoolClass } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  History,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  Calendar,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  X
} from 'lucide-react';

interface OfficerHistoryViewProps {
  user: UserSession;
}

export const OfficerHistoryView: React.FC<OfficerHistoryViewProps> = ({ user }) => {
  const [inputs, setInputs] = useState<WasteInput[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingInput, setEditingInput] = useState<WasteInput | null>(null);
  const [editClassId, setEditClassId] = useState('');
  const [editTanggal, setEditTanggal] = useState('');
  const [editOrganik, setEditOrganik] = useState<number>(0);
  const [editAnorganik, setEditAnorganik] = useState<number>(0);
  const [editB3, setEditB3] = useState<number>(0);
  const [editCatatan, setEditCatatan] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Modal State
  const [deleteInputTarget, setDeleteInputTarget] = useState<{ id: string; kelasName: string; tanggal: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchInputs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inputsData, classesData] = await Promise.all([
        api.getInputs(),
        api.getClasses(),
      ]);
      setInputs(inputsData);
      setClasses(classesData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat riwayat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInputs();
  }, []);

  const openEditModal = (item: WasteInput) => {
    setEditingInput(item);
    setEditClassId(item.kelasId);
    setEditTanggal(item.tanggal);
    setEditOrganik(item.organik);
    setEditAnorganik(item.anorganik);
    setEditB3(item.b3);
    setEditCatatan(item.catatan || '');
    setEditError(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInput) return;

    setEditLoading(true);
    setEditError(null);
    try {
      await api.updateInput(editingInput.id, {
        kelasId: editClassId,
        tanggal: editTanggal,
        organik: editOrganik,
        anorganik: editAnorganik,
        b3: editB3,
        catatan: editCatatan,
      });

      setEditingInput(null);
      fetchInputs();
    } catch (err: any) {
      setEditError(err.message || 'Gagal memperbarui data');
    } finally {
      setEditLoading(false);
    }
  };

  const promptDelete = (item: WasteInput) => {
    setDeleteError(null);
    setDeleteInputTarget({ id: item.id, kelasName: item.kelasName, tanggal: item.tanggal });
  };

  const handleConfirmDelete = async () => {
    if (!deleteInputTarget) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await api.deleteInput(deleteInputTarget.id);
      setDeleteInputTarget(null);
      fetchInputs();
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus data input sampah');
    } finally {
      setDeleteLoading(false);
    }
  };

  const availableClassesForEdit = classes.filter((c) => {
    if (user.role === 'petugas' && user.kelasAsal) {
      return (
        c.name.toLowerCase() !== user.kelasAsal.toLowerCase() &&
        c.id.toLowerCase() !== user.kelasAsal.toLowerCase()
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
              <History className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {user.role === 'admin' ? 'Semua Catatan Input Sampah' : 'Riwayat Input Saya'}
              </h2>
              <p className="text-xs text-slate-500">
                {user.role === 'admin'
                  ? 'Akses admin penuh: dapat mengedit dan menghapus semua catatan sampah kapan pun.'
                  : `Menampilkan hanya data input milik ${user.nama}. Data dapat diedit selama 1 hari (24 jam) sejak dibuat.`}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchInputs}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* Notice about 24h rule */}
      {user.role === 'petugas' && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-700 shrink-0" />
            <span>
              <strong>Ketentuan Kunci Data 1 Hari:</strong> Anda dapat mengoreksi data selama belum lewat 24 jam. Setelah 24 jam, data otomatis terkunci demi integritas laporan mingguan.
            </span>
          </div>
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Memuat catatan input...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-rose-900">{error}</p>
        </div>
      ) : inputs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <History className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Belum Ada Riwayat Input</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {user.role === 'petugas'
              ? 'Anda belum pernah mencatat sampah kelas lain. Masuk ke menu "Input Sampah" untuk mulai.'
              : 'Belum ada data sampah yang diinput oleh petugas.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Tanggal & Waktu</th>
                  <th className="py-3.5 px-4">Kelas Target</th>
                  <th className="py-3.5 px-4 text-center">Organik</th>
                  <th className="py-3.5 px-4 text-center">Anorganik</th>
                  <th className="py-3.5 px-4 text-center">B3</th>
                  <th className="py-3.5 px-4 text-center font-extrabold text-emerald-800">Total Biji</th>
                  {user.role === 'admin' && <th className="py-3.5 px-4">Petugas</th>}
                  <th className="py-3.5 px-4">Status & Kunci</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inputs.map((item) => {
                  const isEditable = user.role === 'admin' || item.canEdit;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{item.tanggal}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-900 rounded-lg border border-emerald-200">
                          Kelas {item.kelasName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-emerald-700 font-semibold">
                        {item.organik}
                      </td>

                      <td className="py-3.5 px-4 text-center text-sky-700 font-semibold">
                        {item.anorganik}
                      </td>

                      <td className="py-3.5 px-4 text-center text-rose-700 font-semibold">
                        {item.b3}
                      </td>

                      <td className="py-3.5 px-4 text-center font-extrabold text-sm text-slate-900">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                          {item.total}
                        </span>
                      </td>

                      {user.role === 'admin' && (
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {item.petugasName}
                        </td>
                      )}

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800">
                            <Unlock className="w-3 h-3" />
                            Akses Admin (Bebas Edit)
                          </span>
                        ) : item.canEdit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <Unlock className="w-3 h-3 text-emerald-600" />
                            Dapat Diedit (Sisa {item.hoursRemaining ?? 24} jam)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            <Lock className="w-3 h-3 text-slate-400" />
                            Terkunci (&gt;24 Jam)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditable ? (
                            <button
                              onClick={() => openEditModal(item)}
                              title="Edit data"
                              className="p-1.5 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span title="Data telah lewat 1 hari dan terkunci" className="p-1.5 text-slate-300 cursor-not-allowed">
                              <Lock className="w-4 h-4" />
                            </span>
                          )}

                          {user.role === 'admin' && (
                            <button
                              onClick={() => promptDelete(item)}
                              title="Hapus data (Admin)"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Edit Catatan Sampah</h3>
              </div>
              <button
                onClick={() => setEditingInput(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas
                  </label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {availableClassesForEdit.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={editTanggal}
                    onChange={(e) => setEditTanggal(e.target.value)}
                    required
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Counts */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-center">
                  <span className="block text-[11px] font-bold text-emerald-900 mb-1">Organik</span>
                  <input
                    type="number"
                    min="0"
                    value={editOrganik}
                    onChange={(e) => setEditOrganik(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-center py-1 text-sm font-bold bg-white rounded-lg border border-emerald-300"
                  />
                </div>
                <div className="p-2.5 bg-sky-50 rounded-xl text-center">
                  <span className="block text-[11px] font-bold text-sky-900 mb-1">Anorganik</span>
                  <input
                    type="number"
                    min="0"
                    value={editAnorganik}
                    onChange={(e) => setEditAnorganik(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-center py-1 text-sm font-bold bg-white rounded-lg border border-sky-300"
                  />
                </div>
                <div className="p-2.5 bg-rose-50 rounded-xl text-center">
                  <span className="block text-[11px] font-bold text-rose-900 mb-1">B3</span>
                  <input
                    type="number"
                    min="0"
                    value={editB3}
                    onChange={(e) => setEditB3(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-center py-1 text-sm font-bold bg-white rounded-lg border border-rose-300"
                  />
                </div>
              </div>

              {/* Total preview */}
              <div className="p-2.5 bg-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Total Baru:</span>
                <span className="text-emerald-700 text-sm">
                  {editOrganik + editAnorganik + editB3} biji
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan
                </label>
                <input
                  type="text"
                  value={editCatatan}
                  onChange={(e) => setEditCatatan(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingInput(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition"
                >
                  {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE INPUT MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteInputTarget)}
        title="Hapus Catatan Sampah"
        message={`Apakah Anda yakin ingin menghapus catatan input sampah untuk Kelas ${deleteInputTarget?.kelasName} pada tanggal ${deleteInputTarget?.tanggal}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Catatan"
        confirmVariant="danger"
        isLoading={deleteLoading}
        errorMessage={deleteError}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          if (!deleteLoading) {
            setDeleteInputTarget(null);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
};
