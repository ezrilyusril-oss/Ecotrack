import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RankingsResponse, RankedClass } from '../types';
import { exportRankingsToExcel, triggerPrintReport } from '../utils/exportUtils';
import confetti from 'canvas-confetti';
import {
  Trophy,
  AlertTriangle,
  Sparkles,
  Calendar,
  FileSpreadsheet,
  Printer,
  Mic,
  RefreshCw,
  Award,
  ShieldAlert,
  ChevronRight,
  Info
} from 'lucide-react';

interface RankingsViewProps {
  onOpenCeremonyModal: () => void;
}

export const RankingsView: React.FC<RankingsViewProps> = ({ onOpenCeremonyModal }) => {
  const [rankings, setRankings] = useState<RankingsResponse | null>(null);
  const [filter, setFilter] = useState<'this_week' | 'all_time'>('this_week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRankings(filter);
      setRankings(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data peringkat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [filter]);

  const celebrateClean = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#059669', '#34d399', '#6ee7b7'],
    });
  };

  const handleExportExcel = () => {
    if (!rankings) return;
    const weekLabel = filter === 'this_week' ? 'Pekan_Ini' : 'Semua_Semester';
    exportRankingsToExcel(
      rankings.cleanestRanked,
      rankings.dirtiestRanked,
      weekLabel,
      `Rekap_Peringkat_Kebersihan_${weekLabel}_SMAN11Maros.xlsx`
    );
  };

  const handlePrintRankings = () => {
    if (!rankings) return;
    const filterTitle =
      filter === 'this_week'
        ? `Rekap Mingguan (Pekan Berjalan: ${rankings.weekStart || '-'} s/d ${rankings.weekEnd || '-'})`
        : 'Rekap Seluruh Data Semester';

    const cleanestRows = rankings.cleanestRanked
      .map(
        (c) => `
        <tr>
          <td class="text-center font-bold">${c.rank}</td>
          <td><strong>${c.kelasName}</strong></td>
          <td class="text-right">${c.organik}</td>
          <td class="text-right">${c.anorganik}</td>
          <td class="text-right">${c.b3}</td>
          <td class="text-right"><strong>${c.total}</strong></td>
          <td class="text-center"><span class="badge badge-clean">${c.rank === 1 ? 'Juara 1 Terbersih' : 'Kelas Bersih'}</span></td>
        </tr>
      `
      )
      .join('');

    const dirtiestRows = rankings.dirtiestRanked
      .map(
        (c) => `
        <tr>
          <td class="text-center font-bold">${c.rank}</td>
          <td><strong>${c.kelasName}</strong></td>
          <td class="text-right">${c.organik}</td>
          <td class="text-right">${c.anorganik}</td>
          <td class="text-right">${c.b3}</td>
          <td class="text-right"><strong>${c.total}</strong></td>
          <td>${c.kenaSanksi ? `<span class="badge badge-sanksi">TERKENA SANKSI: ${c.sanksiJenis}</span>` : 'Aman'}</td>
        </tr>
      `
      )
      .join('');

    const content = `
      <h3 style="text-align: center; margin-bottom: 5px;">REKAP PERINGKAT KEBERSIHAN KELAS</h3>
      <p style="text-align: center; margin-top: 0; color: #64748b; font-size: 13px;">${filterTitle}</p>
      
      <h4 style="color: #047857; margin-top: 20px; margin-bottom: 8px;">1. DAFTAR KELAS TERBERSIH (Total Sampah Terendah)</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 10%;">Peringkat</th>
            <th style="width: 25%;">Nama Kelas</th>
            <th style="width: 12%;">Organik</th>
            <th style="width: 12%;">Anorganik</th>
            <th style="width: 12%;">B3</th>
            <th style="width: 14%;">Total (Biji)</th>
            <th style="width: 15%;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${cleanestRows}
        </tbody>
      </table>

      <h4 style="color: #b91c1c; margin-top: 30px; margin-bottom: 8px;">2. DAFTAR KELAS DENGAN SAMPAH TERBANYAK (Penerima Sanksi)</h4>
      <table>
        <thead>
          <tr>
            <th style="width: 10%;">Urutan</th>
            <th style="width: 25%;">Nama Kelas</th>
            <th style="width: 12%;">Organik</th>
            <th style="width: 12%;">Anorganik</th>
            <th style="width: 12%;">B3</th>
            <th style="width: 14%;">Total (Biji)</th>
            <th style="width: 15%;">Status Sanksi</th>
          </tr>
        </thead>
        <tbody>
          ${dirtiestRows}
        </tbody>
      </table>
    `;

    triggerPrintReport(`Rekap Kebersihan SMA Negeri 11 Maros`, content);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Menghitung peringkat kebersihan kelas...</p>
      </div>
    );
  }

  if (error || !rankings) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-rose-900">Gagal Memuat Peringkat</h3>
        <p className="text-xs text-rose-700">{error || 'Data tidak tersedia'}</p>
        <button
          onClick={fetchRankings}
          className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { cleanestRanked, dirtiestRanked } = rankings;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Controls & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Trophy className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Peringkat Kebersihan Kelas
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total = Organik + Anorganik + B3 (semua jenis berbobot sama). Peringkat seri (sama) bila total sama persis.
          </p>
        </div>

        {/* Filter and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Period Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('this_week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'this_week'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pekan Ini (Upacara)
            </button>
            <button
              onClick={() => setFilter('all_time')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'all_time'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Semester
            </button>
          </div>

          {/* Ceremony Mode Button */}
          <button
            onClick={onOpenCeremonyModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-amber-500/20 transition cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Naskah Upacara Senin</span>
          </button>

          {/* Export & Print */}
          <button
            onClick={handleExportExcel}
            title="Unduh Excel"
            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrintRankings}
            title="Cetak Laporan / PDF"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Flag / Ceremony Info Callout */}
      <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
            🇮🇩
          </div>
          <div>
            <p className="font-bold text-amber-950">
              Pengumuman Resmi Upacara Bendera Hari Senin
            </p>
            <p className="text-amber-800 text-[11px]">
              {filter === 'this_week'
                ? `Peringkat dihitung per minggu (${rankings.weekStart || 'Senin'} s/d ${rankings.weekEnd || 'Jumat'}). 3 kelas sampah terbanyak wajib melaksanakan sanksi kerja bakti.`
                : 'Menampilkan akumulasi seluruh data semester. Beralih ke "Pekan Ini" untuk naskah pengumuman upacara terdekat.'}
            </p>
          </div>
        </div>
        <button
          onClick={celebrateClean}
          className="text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 transition shrink-0"
        >
          ✨ Apresiasi Kelas Bersih
        </button>
      </div>

      {/* TWO RANKINGS SIDE BY SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RANKING 1: KELAS TERBERSIH */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  1. Kelas Terbersih
                </h3>
                <p className="text-xs text-emerald-700 font-medium">
                  Total sampah paling sedikit (Urutan terendah ke tertinggi)
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {cleanestRanked.length} Kelas
            </span>
          </div>

          <p className="text-xs text-slate-500 italic">
            Cukup tampilkan nama kelas di peringkat, tanpa penghargaan khusus.
          </p>

          <div className="space-y-2">
            {cleanestRanked.map((item, idx) => {
              const isFirst = item.rank === 1;
              return (
                <div
                  key={item.kelasId}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isFirst
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                      : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                        isFirst
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      #{item.rank}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">
                        {item.kelasName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Org: {item.organik} • Anorg: {item.anorganik} • B3: {item.b3}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-800">
                      {item.total}{' '}
                      <span className="text-[11px] font-medium text-slate-500">biji</span>
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {item.inputCount}x pencatatan
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RANKING 2: KELAS DENGAN SAMPAH TERBANYAK */}
        <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-100 text-rose-800 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  2. Kelas dengan Sampah Terbanyak
                </h3>
                <p className="text-xs text-rose-700 font-medium">
                  3 Teratas terkena sanksi kerja bakti atau denda
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              3 Kena Sanksi
            </span>
          </div>

          <p className="text-xs text-slate-500 italic">
            Tiga kelas teratas dengan timbulan sampah terbanyak wajib menunaikan sanksi lingkungan.
          </p>

          <div className="space-y-2">
            {dirtiestRanked.map((item) => {
              const hasSanction = item.kenaSanksi;
              return (
                <div
                  key={item.kelasId}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    hasSanction
                      ? 'bg-rose-50/90 border-rose-300 shadow-sm'
                      : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs ${
                          hasSanction
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        #{item.rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">
                            {item.kelasName}
                          </h4>
                          {hasSanction && (
                            <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold rounded-md uppercase tracking-wider animate-pulse">
                              Kena Sanksi
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Org: {item.organik} • Anorg: {item.anorganik} • B3: {item.b3}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-rose-800">
                        {item.total}{' '}
                        <span className="text-[11px] font-medium text-slate-500">biji</span>
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {item.inputCount}x pencatatan
                      </span>
                    </div>
                  </div>

                  {hasSanction && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200/80 flex items-center gap-1.5 text-xs text-rose-900 font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{item.sanksiJenis || 'Kerja Bakti Lingkungan Sekolah'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
