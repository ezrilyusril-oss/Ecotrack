import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import {
  Trash2,
  FileText,
  Building2,
  Users,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  Info,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'daily' | 'class_stacked'>('daily');
  const [activeHoverBar, setActiveHoverBar] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data statistik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Memuat data statistik EcoTrack...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-rose-900">Gagal Memuat Dashboard</h3>
        <p className="text-xs text-rose-700">{error || 'Data tidak tersedia'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { summary, dailyData, classBreakdown } = stats;

  // Max value calculation for class grouped bar chart scaling (highest single category)
  const maxClassCategory = Math.max(
    ...classBreakdown.flatMap((c) => [c.organik, c.anorganik, c.b3]),
    10
  );

  // Max value calculation for daily grouped bar chart scaling (highest single category)
  const maxDailyCategory = Math.max(
    ...dailyData.flatMap((d) => [d.organik, d.anorganik, d.b3]),
    10
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Hero Intro */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700/60 backdrop-blur-sm rounded-full text-xs font-semibold text-emerald-200 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Sispaling SMA Negeri 11 Maros</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Pemantauan Sampah Kelas
          </h2>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            Data pencatatan sampah harian dari seluruh kelas. Diperbarui setiap hari sekolah (Senin - Jumat) untuk menciptakan lingkungan belajar yang bersih, asri, dan berdisiplin.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 4 SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Sampah */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Sampah Terkumpul
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {summary.totalSampah.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-emerald-700">biji</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="text-emerald-700 font-medium">Org: {summary.totalOrganik}</span>
            <span className="text-sky-700 font-medium">Anorg: {summary.totalAnorganik}</span>
            <span className="text-rose-700 font-medium">B3: {summary.totalB3}</span>
          </div>
        </div>

        {/* Card 2: Total Transaksi */}
        <div className="bg-white rounded-2xl p-5 border border-teal-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Transaksi
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {summary.totalTransaksi.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-teal-700">catatan input</span>
          </div>
          <p className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Setiap data diverifikasi petugas Sispaling
          </p>
        </div>

        {/* Card 3: Jumlah Kelas Menyetor */}
        <div className="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kelas Sudah Menyetor
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {summary.kelasMenyetor}
            </span>
            <span className="text-xs font-semibold text-blue-700">
              / {summary.totalKelas} Kelas
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round((summary.kelasMenyetor / (summary.totalKelas || 1)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Card 4: Petugas Tercatat */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Petugas Tercatat
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {summary.totalPetugas}
            </span>
            <span className="text-xs font-semibold text-purple-700">anggota aktif</span>
          </div>
          <p className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Siswa kader lingkungan berwenang
          </p>
        </div>
      </div>

      {/* SINGLE UNIFIED CHART AREA WITH SWITCH */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Chart Header & Toggle Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {chartView === 'daily' ? (
                <>
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Grafik Harian: Perkembangan Sampah dari Hari ke Hari (Batang Berjejer)</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 text-teal-600" />
                  <span>Grafik Bulanan per Kelas (Batang Berjejer: Semua Kelas)</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {chartView === 'daily'
                ? 'Tiga batang berdampingan per hari: Organik (hijau), Anorganik (biru), dan B3 (merah muda).'
                : 'Tiga batang berdampingan per kelas: Organik (hijau), Anorganik (biru), dan B3 (merah muda).'}
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
            <button
              onClick={() => setChartView('daily')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                chartView === 'daily'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Grafik Harian</span>
            </button>
            <button
              onClick={() => setChartView('class_stacked')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                chartView === 'class_stacked'
                  ? 'bg-teal-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Grafik Bulanan per Kelas</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Kategori Sampah (Satuan: Biji):
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500 shadow-xs" />
            <span className="font-semibold text-emerald-900">Organik</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-sky-500 shadow-xs" />
            <span className="font-semibold text-sky-900">Anorganik</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-rose-500 shadow-xs" />
            <span className="font-semibold text-rose-900">B3</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-[11px] text-emerald-800">
            <Info className="w-3.5 h-3.5 text-emerald-600" />
            <span>Batang berjejer berdampingan • Angka di atas batang • Total gabungan di tooltip</span>
          </div>
        </div>

        {/* VIEW 1: GRAFIK HARIAN (GROUPED BAR) */}
        {chartView === 'daily' && (
          <div className="space-y-4 pt-2">
            {dailyData.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Belum ada data transaksi harian.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Visual Grouped Bar Chart */}
                <div className="overflow-x-auto pb-2">
                  <div className="min-w-[500px] h-64 sm:h-72 flex items-end gap-3 sm:gap-6 pt-8 pb-2 px-2 border-b border-slate-200">
                    {dailyData.map((d) => {
                      const dateObj = new Date(d.tanggal + 'T00:00:00');
                      const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
                      const dateFormatted = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                      const orgHeight = d.organik > 0 ? Math.max(6, Math.round((d.organik / maxDailyCategory) * 85)) : 2;
                      const anorgHeight = d.anorganik > 0 ? Math.max(6, Math.round((d.anorganik / maxDailyCategory) * 85)) : 2;
                      const b3Height = d.b3 > 0 ? Math.max(6, Math.round((d.b3 / maxDailyCategory) * 85)) : 2;

                      return (
                        <div
                          key={d.tanggal}
                          className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer min-w-[70px] sm:min-w-[80px]"
                          onMouseEnter={() => setActiveHoverBar(d.tanggal)}
                          onMouseLeave={() => setActiveHoverBar(null)}
                        >
                          {/* Hover Tooltip displaying total and breakdown */}
                          {activeHoverBar === d.tanggal && (
                            <div className="absolute -top-24 z-30 bg-slate-900/95 backdrop-blur-sm text-white text-[11px] p-2.5 rounded-xl shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700">
                              <p className="font-bold text-amber-300 text-xs">{dayName}, {dateFormatted}</p>
                              <div className="my-1 py-1 border-y border-slate-700/80">
                                <p className="text-white font-extrabold text-xs">
                                  Total Gabungan: <span className="text-emerald-400 font-black">{d.total} biji</span>
                                </p>
                              </div>
                              <div className="space-y-0.5 text-[10px]">
                                <p className="text-emerald-400 font-semibold">🌿 Organik: {d.organik} biji</p>
                                <p className="text-sky-400 font-semibold">🥤 Anorganik: {d.anorganik} biji</p>
                                <p className="text-rose-400 font-semibold">⚠️ B3: {d.b3} biji</p>
                              </div>
                            </div>
                          )}

                          {/* 3 Grouped Bars Side-by-Side with numbers on top */}
                          <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full pb-1">
                            {/* Organik Bar */}
                            <div className="flex-1 max-w-[22px] flex flex-col items-center justify-end h-full group/bar">
                              <span className="text-[10px] font-black text-emerald-700 mb-0.5 leading-none">
                                {d.organik}
                              </span>
                              <div
                                className="w-full bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover/bar:brightness-110 shadow-xs"
                                style={{ height: `${orgHeight}%` }}
                                title={`Organik: ${d.organik} biji`}
                              />
                            </div>

                            {/* Anorganik Bar */}
                            <div className="flex-1 max-w-[22px] flex flex-col items-center justify-end h-full group/bar">
                              <span className="text-[10px] font-black text-sky-700 mb-0.5 leading-none">
                                {d.anorganik}
                              </span>
                              <div
                                className="w-full bg-sky-500 rounded-t-sm transition-all duration-300 group-hover/bar:brightness-110 shadow-xs"
                                style={{ height: `${anorgHeight}%` }}
                                title={`Anorganik: ${d.anorganik} biji`}
                              />
                            </div>

                            {/* B3 Bar */}
                            <div className="flex-1 max-w-[22px] flex flex-col items-center justify-end h-full group/bar">
                              <span className="text-[10px] font-black text-rose-700 mb-0.5 leading-none">
                                {d.b3}
                              </span>
                              <div
                                className="w-full bg-rose-500 rounded-t-sm transition-all duration-300 group-hover/bar:brightness-110 shadow-xs"
                                style={{ height: `${b3Height}%` }}
                                title={`B3: ${d.b3} biji`}
                              />
                            </div>
                          </div>

                          {/* Date Label */}
                          <div className="text-center mt-2">
                            <p className="text-xs font-bold text-slate-800">{dayName}</p>
                            <p className="text-[10px] text-slate-400">{dateFormatted}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Daily data summary cards list */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {dailyData.map((d) => (
                    <div
                      key={d.tanggal}
                      className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1"
                    >
                      <p className="font-bold text-slate-800">
                        {new Date(d.tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-sm font-extrabold text-emerald-800">{d.total} biji total</p>
                      <div className="text-[10px] text-slate-600 flex justify-between font-medium">
                        <span className="text-emerald-700">Org: {d.organik}</span>
                        <span className="text-sky-700">Anorg: {d.anorganik}</span>
                        <span className="text-rose-700">B3: {d.b3}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: GRAFIK BULANAN PER KELAS (GROUPED BAR SEMUA KELAS) */}
        {chartView === 'class_stacked' && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                Menampilkan Semua {classBreakdown.length} Kelas Sekaligus (Tanpa Filter)
              </span>
              <span>Tiga batang berjejer berdampingan per kelas • Angka di atas batang</span>
            </div>

            {/* Responsive scrollable container for grouped bar chart */}
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[880px] h-72 sm:h-80 flex items-end gap-3 sm:gap-4 pt-8 pb-2 px-2 border-b border-slate-200">
                {classBreakdown.map((cls) => {
                  const orgHeight = cls.organik > 0 ? Math.max(6, Math.round((cls.organik / maxClassCategory) * 85)) : 2;
                  const anorgHeight = cls.anorganik > 0 ? Math.max(6, Math.round((cls.anorganik / maxClassCategory) * 85)) : 2;
                  const b3Height = cls.b3 > 0 ? Math.max(6, Math.round((cls.b3 / maxClassCategory) * 85)) : 2;

                  return (
                    <div
                      key={cls.kelasId}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer min-w-[56px]"
                      onMouseEnter={() => setActiveHoverBar(cls.kelasId)}
                      onMouseLeave={() => setActiveHoverBar(null)}
                    >
                      {/* Interactive Tooltip on Hover with total combined */}
                      {activeHoverBar === cls.kelasId && (
                        <div className="absolute -top-24 z-30 bg-slate-900/95 backdrop-blur-sm text-white text-[11px] p-2.5 rounded-xl shadow-2xl whitespace-nowrap pointer-events-none border border-slate-700">
                          <p className="font-bold text-amber-300 text-xs">Kelas {cls.kelasName}</p>
                          <div className="my-1 py-1 border-y border-slate-700/80">
                            <p className="text-white font-extrabold text-xs">
                              Total Gabungan: <span className="text-emerald-400 font-black">{cls.total} biji</span>
                            </p>
                          </div>
                          <div className="space-y-0.5 text-[10px]">
                            <p className="text-emerald-400 font-semibold">🌿 Organik: {cls.organik} biji</p>
                            <p className="text-sky-400 font-semibold">🥤 Anorganik: {cls.anorganik} biji</p>
                            <p className="text-rose-400 font-semibold">⚠️ B3: {cls.b3} biji</p>
                          </div>
                        </div>
                      )}

                      {/* 3 Grouped Bars Side-by-Side with numbers on top */}
                      <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                        {/* Organik Bar */}
                        <div className="flex-1 max-w-[18px] flex flex-col items-center justify-end h-full group/bar">
                          <span className="text-[10px] font-black text-emerald-700 mb-0.5 leading-none">
                            {cls.organik}
                          </span>
                          <div
                            className="w-full bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover/bar:brightness-110 shadow-xs"
                            style={{ height: `${orgHeight}%` }}
                            title={`Organik: ${cls.organik} biji`}
                          />
                        </div>

                        {/* Anorganik Bar */}
                        <div className="flex-1 max-w-[18px] flex flex-col items-center justify-end h-full group/bar">
                          <span className="text-[10px] font-black text-sky-700 mb-0.5 leading-none">
                            {cls.anorganik}
                          </span>
                          <div
                            className="w-full bg-sky-500 rounded-t-sm transition-all duration-300 group-hover/bar:brightness-110 shadow-xs"
                            style={{ height: `${anorgHeight}%` }}
                            title={`Anorganik: ${cls.anorganik} biji`}
                          />
                        </div>

                        {/* B3 Bar */}
                        <div className="flex-1 max-w-[18px] flex flex-col items-center justify-end h-full group/bar">
                          <span className="text-[10px] font-black text-rose-700 mb-0.5 leading-none">
                            {cls.b3}
                          </span>
                          <div
                            className="w-full bg-rose-500 rounded-t-sm transition-all duration-300 group-hover/bar:brightness-110 shadow-xs"
                            style={{ height: `${b3Height}%` }}
                            title={`B3: ${cls.b3} biji`}
                          />
                        </div>
                      </div>

                      {/* Class Label underneath */}
                      <div className="text-center mt-2.5">
                        <span className="text-[11px] font-bold text-slate-700 whitespace-nowrap block group-hover:text-emerald-700">
                          {cls.kelasName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Summary Strip */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-emerald-950 font-medium">
                  Grafik batang berjejer (grouped bar) menampilkan 3 batang berdampingan per kelas untuk perbandingan langsung volume Organik, Anorganik, dan B3.
                </span>
              </div>
              <span className="font-semibold text-emerald-800 text-[11px] bg-white px-3 py-1 rounded-full border border-emerald-200">
                Total {classBreakdown.length} Kelas Aktif
              </span>
            </div>
          </div>
        )}
      </div>

      {/* EDUCATIONAL CARDS: 3 WASTE TYPES IN BIJI UNIT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Organik */}
        <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-100/50 rounded-2xl border border-emerald-200 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
            <h4 className="font-bold text-emerald-950 text-sm">1. Sampah Organik</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sampah yang mudah terurai hayati: sisa bekal makanan, daun kering halaman, kulit buah, dan serpihan kertas basah.
          </p>
          <div className="pt-2 text-[11px] font-semibold text-emerald-800 flex items-center justify-between border-t border-emerald-200/60">
            <span>Satuan Input:</span>
            <span className="bg-emerald-200/60 px-2 py-0.5 rounded">Jumlah per Biji</span>
          </div>
        </div>

        {/* Anorganik */}
        <div className="p-5 bg-gradient-to-br from-sky-50 to-blue-100/50 rounded-2xl border border-sky-200 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-sky-500" />
            <h4 className="font-bold text-sky-950 text-sm">2. Sampah Anorganik</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Sampah anorganik/daur ulang: botol plastik, gelas plastik kemasan, sedotan, kantong kresek, sachet snack, kaleng.
          </p>
          <div className="pt-2 text-[11px] font-semibold text-sky-800 flex items-center justify-between border-t border-sky-200/60">
            <span>Satuan Input:</span>
            <span className="bg-sky-200/60 px-2 py-0.5 rounded">Jumlah per Biji</span>
          </div>
        </div>

        {/* B3 */}
        <div className="p-5 bg-gradient-to-br from-rose-50 to-red-100/50 rounded-2xl border border-rose-200 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500" />
            <h4 className="font-bold text-rose-950 text-sm">3. Sampah B3 (Berbahaya)</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Bahan Berbahaya & Beracun: spidol whiteboard bekas, baterai jam dinding/remote, pecahan kaca/bohlam lampu, sisa korek gas.
          </p>
          <div className="pt-2 text-[11px] font-semibold text-rose-800 flex items-center justify-between border-t border-rose-200/60">
            <span>Satuan Input:</span>
            <span className="bg-rose-200/60 px-2 py-0.5 rounded">Jumlah per Biji</span>
          </div>
        </div>
      </div>
    </div>
  );
};
