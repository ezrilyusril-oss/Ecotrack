import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RankingsResponse } from '../types';
import { triggerPrintReport } from '../utils/exportUtils';
import {
  X,
  Mic,
  Copy,
  Check,
  Printer,
  Sparkles,
  AlertTriangle,
  Volume2,
  Calendar,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CeremonyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CeremonyModal: React.FC<CeremonyModalProps> = ({ isOpen, onClose }) => {
  const [rankings, setRankings] = useState<RankingsResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.getRankings('this_week')
        .then((res) => setRankings(res))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanestTop3 = rankings?.cleanestRanked.slice(0, 3) || [];
  const dirtiestTop3 = rankings?.dirtiestRanked.filter((c) => c.kenaSanksi) || [];

  const speechScript = `NASKAH PENGUMUMAN REKAP KEBERSIHAN KELAS
TIM SISPALING - SMA NEGERI 11 MAROS
UPACARA BENDERA HARI SENIN

Assalamu'alaikum Warahmatullahi Wabarakatuh dan Selamat Pagi.

Yang terhormat Bapak/Ibu Kepala Sekolah, Bapak/Ibu Dewan Guru, Staf Tata Usaha, serta seluruh rekan-rekan siswa-siswi SMA Negeri 11 Maros yang kami banggakan.

Berkenan kami dari Tim Siswa Peduli Lingkungan (Sispaling) menyampaikan rekapitulasi kebersihan dan timbulan sampah harian kelas untuk pekan ini:

🌿 1. PENGUMUMAN KELAS TERBERSIH (SAMPAH PALING SEDIKIT):
${cleanestTop3.map((c, i) => `• Peringkat ${c.rank}: Kelas ${c.kelasName} dengan total ${c.total} biji sampah.`).join('\n')}

Mari kita berikan tepuk tangan apresiasi kepada kelas-kelas yang telah menjaga kebersihan ruang belajarnya secara konsisten.

⚠️ 2. PENGUMUMAN KELAS DENGAN TIMBULAN SAMPAH TERBANYAK:
Berdasarkan aturan Sispaling, 3 kelas dengan volume sampah terbanyak dikenakan sanksi lingkungan:
${dirtiestTop3.map((c) => `• Urutan ${c.rank}: Kelas ${c.kelasName} (Total: ${c.total} biji sampah). Sanksi: ${c.sanksiJenis || 'Kerja bakti lapangan sekolah'}.`).join('\n')}

Bagi perwakilan wali kelas dan ketua kelas yang disebutkan, dimohon melapor ke Posko Sispaling setelah upacara untuk koordinasi pelaksanaan sanksi kerja bakti dan denda pemilahan.

Mari bersama-sama menjaga keasrian SMA Negeri 11 Maros: Buang sampah pada tempatnya, pilah Organik, Anorganik, dan B3!

Wassalamu'alaikum Warahmatullahi Wabarakatuh.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(speechScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintCeremony = () => {
    triggerPrintReport(
      'Naskah Pengumuman Upacara Senin - SMAN 11 Maros',
      `
      <div style="font-size: 14px; line-height: 1.8; padding: 10px 20px;">
        <h3 style="text-align: center; color: #047857; margin-bottom: 20px;">
          NASKAH PENGUMUMAN RESMI UPACARA BENDERA HARI SENIN<br>
          <span style="font-size: 13px; color: #64748b; font-weight: normal;">Pekan: ${rankings?.weekStart || '-'} s/d ${rankings?.weekEnd || '-'}</span>
        </h3>
        <p><strong>Assalamu'alaikum Warahmatullahi Wabarakatuh dan Selamat Pagi.</strong></p>
        <p>Yang terhormat Bapak/Ibu Kepala Sekolah, Dewan Guru, serta seluruh rekan siswa SMA Negeri 11 Maros.</p>
        <p>Berikut hasil monitoring sampah kelas pekan ini oleh Tim Sispaling:</p>
        
        <h4 style="color: #047857; margin-top: 15px;">1. KELAS TERBERSIH:</h4>
        <ol>
          ${cleanestTop3.map((c) => `<li><strong>${c.kelasName}</strong>: Total ${c.total} biji sampah (Org: ${c.organik}, Anorg: ${c.anorganik}, B3: ${c.b3})</li>`).join('')}
        </ol>

        <h4 style="color: #b91c1c; margin-top: 15px;">2. KELAS DENGAN SAMPAH TERBANYAK (PENERIMA SANKSI):</h4>
        <ol>
          ${dirtiestTop3.map((c) => `<li><strong>${c.kelasName}</strong>: Total ${c.total} biji sampah. <span style="color: #b91c1c; font-weight: bold;">Sanksi: ${c.sanksiJenis}</span></li>`).join('')}
        </ol>

        <p style="margin-top: 25px;">Mari wujudkan SMA Negeri 11 Maros yang bersih, sehat, dan berbudaya lingkungan!</p>
      </div>
    `
    );
  };

  const handleConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-emerald-200">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white p-0.5 border-2 border-emerald-400 flex items-center justify-center shrink-0 shadow-md">
              <img src="/logo.png" alt="Logo Sispaling" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl text-white">
                Teks Siap Baca Upacara Hari Senin
              </h3>
              <p className="text-xs text-emerald-200">
                Format Naskah Resmi Tim Sispaling SMA Negeri 11 Maros
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Teleprompter format */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 font-sans">
          {loading ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Menyiapkan naskah pengumuman upacara...
            </div>
          ) : (
            <>
              {/* Teleprompter Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 text-sm sm:text-base leading-relaxed font-medium">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs text-slate-500">
                  <span className="font-bold text-emerald-800 uppercase tracking-wider">
                    Teleprompter Pengumuman Upacara
                  </span>
                  <span>Huruf Besar & Jelas di HP</span>
                </div>

                <p className="italic text-slate-600">
                  "Assalamu'alaikum Warahmatullahi Wabarakatuh dan Selamat Pagi kepada segenap Bapak/Ibu Guru serta rekan-rekan siswa SMA Negeri 11 Maros..."
                </p>

                {/* Section 1: Cleanest */}
                <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>KELAS TERBERSIH PEKAN INI:</span>
                  </div>
                  <div className="space-y-1.5 pl-2">
                    {cleanestTop3.map((c) => (
                      <div key={c.kelasId} className="flex items-center justify-between font-bold text-emerald-900">
                        <span>Peringkat #{c.rank} : Kelas {c.kelasName}</span>
                        <span className="text-xs bg-emerald-200 px-2 py-0.5 rounded-full">{c.total} biji</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Sanction Classes */}
                <div className="p-4 bg-rose-100/70 border border-rose-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-950 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>KELAS DENGAN SAMPAH TERBANYAK (KENA SANKSI):</span>
                  </div>
                  <div className="space-y-2 pl-2">
                    {dirtiestTop3.map((c) => (
                      <div key={c.kelasId} className="border-b border-rose-200 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between font-bold text-rose-950">
                          <span>Urutan #{c.rank} : Kelas {c.kelasName}</span>
                          <span className="text-xs bg-rose-200 px-2 py-0.5 rounded-full">{c.total} biji</span>
                        </div>
                        <p className="text-xs text-rose-800 font-semibold mt-0.5">
                          👉 Sanksi: {c.sanksiJenis || 'Kerja bakti pembersihan lapangan sekolah'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                  Penutup: "Kepada ketua kelas penerima sanksi, harap berkumpul di depan posko Sispaling selesai upacara untuk pembagian perlengkapan kerja bakti. Terima kasih!"
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleConfetti}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5"
          >
            <span>🎉 Sambut Tepuk Tangan</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Naskah'}</span>
            </button>

            <button
              onClick={handlePrintCeremony}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Cetak PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
