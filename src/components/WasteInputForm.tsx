import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SchoolClass, UserSession } from '../types';
import confetti from 'canvas-confetti';
import {
  PlusCircle,
  Calendar,
  Building2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldAlert
} from 'lucide-react';

interface WasteInputFormProps {
  user: UserSession;
  onSuccess: () => void;
}

export const WasteInputForm: React.FC<WasteInputFormProps> = ({ user, onSuccess }) => {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  
  // Set default date to today, or previous Friday if today is weekend
  const getInitialDate = () => {
    const now = new Date();
    const day = now.getDay();
    if (day === 6) now.setDate(now.getDate() - 1); // Sat -> Fri
    if (day === 0) now.setDate(now.getDate() - 2); // Sun -> Fri
    return now.toISOString().split('T')[0];
  };

  const [tanggal, setTanggal] = useState(getInitialDate());
  const [organik, setOrganik] = useState<number | ''>('');
  const [anorganik, setAnorganik] = useState<number | ''>('');
  const [b3, setB3] = useState<number | ''>('');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load classes
  useEffect(() => {
    api.getClasses()
      .then((data) => {
        setClasses(data);
        // Pre-select first eligible class
        const eligible = data.filter((c) => {
          if (user.role === 'petugas' && user.kelasAsal) {
            return c.name.toLowerCase() !== user.kelasAsal.toLowerCase() && c.id !== user.kelasAsal;
          }
          return true;
        });
        if (eligible.length > 0) {
          setSelectedClassId(eligible[0].id);
        }
      })
      .catch((err) => setError('Gagal memuat daftar kelas: ' + err.message));
  }, [user]);

  // Filter out the officer's own class as per rule!
  const availableClasses = classes.filter((c) => {
    if (user.role === 'petugas' && user.kelasAsal) {
      return (
        c.name.toLowerCase() !== user.kelasAsal.toLowerCase() &&
        c.id.toLowerCase() !== user.kelasAsal.toLowerCase()
      );
    }
    return true;
  });

  const totalCalculated =
    (typeof organik === 'number' ? organik : 0) +
    (typeof anorganik === 'number' ? anorganik : 0) +
    (typeof b3 === 'number' ? b3 : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!selectedClassId) {
      setError('Silakan pilih kelas yang diperiksa');
      return;
    }

    if (!tanggal) {
      setError('Silakan tentukan tanggal input');
      return;
    }

    // Check weekday: Monday to Friday
    const dateObj = new Date(tanggal + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setError('Input sampah hanya diperbolehkan pada hari aktif sekolah (Senin sampai Jumat).');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createInput({
        kelasId: selectedClassId,
        tanggal,
        organik: typeof organik === 'number' ? organik : 0,
        anorganik: typeof anorganik === 'number' ? anorganik : 0,
        b3: typeof b3 === 'number' ? b3 : 0,
        catatan: catatan.trim(),
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      setSuccessMessage(
        `Sukses! Data sampah kelas ${res.input.kelasName} berhasil dicatat sebanyak ${res.input.total} biji.`
      );

      // Reset counters
      setOrganik('');
      setAnorganik('');
      setB3('');
      setCatatan('');

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data input');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-2xl">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Form Pencatatan Sampah Harian
            </h2>
            <p className="text-xs text-slate-500">
              Pencatatan sampah per hari (Senin - Jumat) • Satuan: Jumlah per biji
            </p>
          </div>
        </div>

        {/* Petugas Class Restriction Notice */}
        {user.role === 'petugas' && user.kelasAsal && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Peraturan Sispaling Terkait Objektivitas:</p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Anda login sebagai petugas dari kelas <strong>{user.kelasAsal}</strong>. Kelas Anda otomatis disembunyikan dari daftar pilihan di bawah untuk mencegah konflik kepentingan.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Alerts */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Class Selection & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Class selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Pilih Kelas Target *</span>
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-semibold text-slate-800"
            >
              <option value="" disabled>-- Pilih Kelas yang Diperiksa --</option>
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Kelas {cls.name} (Tingkat {cls.tingkat})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Tersedia {availableClasses.length} kelas untuk diperiksa.
            </p>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Tanggal Pencatatan (Senin - Jumat) *</span>
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-semibold text-slate-800"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Hari aktif sekolah: Senin s/d Jumat.
            </p>
          </div>
        </div>

        {/* 3 WASTE CATEGORY COUNTERS (BIJI) */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Rincian Jenis Sampah (Satuan: Biji)
            </span>
            <span className="text-[11px] text-slate-400">Semua jenis berbobot 1</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Organik */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  1. Organik
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold">biji</span>
              </div>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={organik}
                onChange={(e) => setOrganik(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full text-center py-2 px-3 text-lg font-extrabold bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-900"
              />
              <p className="text-[10px] text-slate-500 leading-tight">
                Sisa makanan, daun, kertas basah
              </p>
              {/* Quick increment buttons */}
              <div className="flex gap-1 pt-1">
                {[1, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setOrganik((prev) => (typeof prev === 'number' ? prev + num : num))}
                    className="flex-1 py-1 text-[10px] font-bold bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md transition"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Anorganik */}
            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  2. Anorganik
                </span>
                <span className="text-[10px] text-sky-700 font-semibold">biji</span>
              </div>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={anorganik}
                onChange={(e) => setAnorganik(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full text-center py-2 px-3 text-lg font-extrabold bg-white border border-sky-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none text-sky-900"
              />
              <p className="text-[10px] text-slate-500 leading-tight">
                Botol plastik, kantong, kemasan snack
              </p>
              <div className="flex gap-1 pt-1">
                {[1, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setAnorganik((prev) => (typeof prev === 'number' ? prev + num : num))}
                    className="flex-1 py-1 text-[10px] font-bold bg-white hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-md transition"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. B3 */}
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  3. B3 (Berbahaya)
                </span>
                <span className="text-[10px] text-rose-700 font-semibold">biji</span>
              </div>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={b3}
                onChange={(e) => setB3(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full text-center py-2 px-3 text-lg font-extrabold bg-white border border-rose-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-rose-900"
              />
              <p className="text-[10px] text-slate-500 leading-tight">
                Spidol bekas, baterai, pecahan kaca
              </p>
              <div className="flex gap-1 pt-1">
                {[1, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setB3((prev) => (typeof prev === 'number' ? prev + num : num))}
                    className="flex-1 py-1 text-[10px] font-bold bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md transition"
                  >
                    +{num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Calculated Total Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl text-white flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-emerald-200 block">
                Total Sampah Dihitung (Organik + Anorganik + B3):
              </span>
              <span className="text-xs text-slate-300">
                Semua jenis berbobot sama untuk perhitungan peringkat
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-300">
                {totalCalculated}
              </span>
              <span className="text-xs text-emerald-200 ml-1 font-semibold">biji</span>
            </div>
          </div>
        </div>

        {/* Optional notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Catatan Tambahan Petugas (Opsional)
          </label>
          <input
            type="text"
            placeholder="Contoh: Sampah didominasi sachet minuman di laci meja siswa..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
          />
        </div>

        {/* Petugas 24h Lock Warning Note */}
        <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
          <span>Petugas: {user.nama} ({user.role === 'admin' ? 'Admin' : `Kelas Asal: ${user.kelasAsal}`})</span>
          <span className="text-slate-400">Data dapat diedit selama 1 hari (24 jam)</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || availableClasses.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer text-sm"
        >
          {loading ? (
            <span>Menyimpan Data...</span>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Simpan Catatan Sampah Kelas</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
