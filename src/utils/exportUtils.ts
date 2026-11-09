import * as XLSX from 'xlsx';
import { WasteInput, RankedClass } from '../types';

export function exportInputsToExcel(inputs: WasteInput[], filename = 'Laporan_Sampah_EcoTrack_SMAN11Maros.xlsx') {
  const data = inputs.map((item, index) => ({
    'No': index + 1,
    'Tanggal': item.tanggal,
    'Kelas': item.kelasName,
    'Organik (biji)': item.organik,
    'Anorganik (biji)': item.anorganik,
    'B3 (biji)': item.b3,
    'Total (biji)': item.total,
    'Petugas Input': item.petugasName,
    'Waktu Catat': new Date(item.createdAt).toLocaleString('id-ID'),
    'Catatan': item.catatan || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Sampah');

  // Auto-fit column widths
  const max_widths = [
    { wch: 6 },  // No
    { wch: 12 }, // Tanggal
    { wch: 14 }, // Kelas
    { wch: 14 }, // Organik
    { wch: 16 }, // Anorganik
    { wch: 10 }, // B3
    { wch: 12 }, // Total
    { wch: 20 }, // Petugas
    { wch: 22 }, // Waktu
    { wch: 30 }, // Catatan
  ];
  worksheet['!cols'] = max_widths;

  XLSX.writeFile(workbook, filename);
}

export function exportRankingsToExcel(
  cleanest: RankedClass[],
  dirtiest: RankedClass[],
  weekInfo: string,
  filename = 'Rekap_Peringkat_Kebersihan_SMAN11Maros.xlsx'
) {
  const cleanestData = cleanest.map((c) => ({
    'Peringkat': c.rank,
    'Nama Kelas': c.kelasName,
    'Organik (biji)': c.organik,
    'Anorganik (biji)': c.anorganik,
    'B3 (biji)': c.b3,
    'Total Sampah (biji)': c.total,
    'Keterangan': c.rank === 1 ? 'Juara 1 Kelas Terbersih' : 'Kelas Bersih',
  }));

  const dirtiestData = dirtiest.map((c) => ({
    'Peringkat Sampah Terbanyak': c.rank,
    'Nama Kelas': c.kelasName,
    'Organik (biji)': c.organik,
    'Anorganik (biji)': c.anorganik,
    'B3 (biji)': c.b3,
    'Total Sampah (biji)': c.total,
    'Status Sanksi': c.kenaSanksi ? `Sanksi: ${c.sanksiJenis}` : 'Aman',
  }));

  const workbook = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(cleanestData);
  const ws2 = XLSX.utils.json_to_sheet(dirtiestData);

  XLSX.utils.book_append_sheet(workbook, ws1, 'Kelas Terbersih');
  XLSX.utils.book_append_sheet(workbook, ws2, 'Kelas Sampah Terbanyak');

  XLSX.writeFile(workbook, filename);
}

export function triggerPrintReport(title: string, contentHtml: string) {
  let printIframe = document.getElementById('ecotrack-print-iframe') as HTMLIFrameElement;
  if (!printIframe) {
    printIframe = document.createElement('iframe');
    printIframe.id = 'ecotrack-print-iframe';
    printIframe.style.position = 'fixed';
    printIframe.style.top = '-9999px';
    printIframe.style.left = '-9999px';
    printIframe.style.width = '0px';
    printIframe.style.height = '0px';
    printIframe.style.border = 'none';
    document.body.appendChild(printIframe);
  }

  const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
  if (!iframeDoc) {
    console.error('Tidak dapat mengakses dokumen cetak');
    return;
  }

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page { size: A4; margin: 15mm; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 20px;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          border-bottom: 3px double #0f172a;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
        .header h3 { margin: 0; font-size: 15px; font-weight: 600; text-transform: uppercase; }
        .header h2 { margin: 4px 0; font-size: 18px; font-weight: 700; color: #047857; text-transform: uppercase; }
        .header p { margin: 2px 0; font-size: 12px; color: #64748b; }
        .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
        }
        .badge-sanksi { background-color: #fee2e2; color: #b91c1c; border: 1px solid #f87171; }
        .badge-clean { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          font-weight: 600;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .signature {
          text-align: center;
          width: 200px;
        }
        .sig-space { height: 60px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 8px;">
          <img src="/logo.png" style="width: 55px; height: 55px; object-fit: contain;" alt="Logo Sispaling" />
          <div style="text-align: left;">
            <h3 style="margin: 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Pemerintah Provinsi Sulawesi Selatan</h3>
            <h2 style="margin: 2px 0; font-size: 18px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 1px;">SMA Negeri 11 Maros</h2>
            <h3 style="margin: 0; font-size: 13px; font-weight: 700; color: #065f46;">Tim Siswa Peduli Lingkungan (Sispaling)</h3>
          </div>
        </div>
        <p style="margin: 4px 0 0; font-size: 11px; color: #64748b; text-align: center;">Aplikasi EcoTrack Sispaling - Sistem Monitoring Sampah Harian Kelas</p>
      </div>
      <div>${contentHtml}</div>
      <div class="footer">
        <div class="signature">
          <p>Mengetahui,<br>Pembina Sispaling</p>
          <div class="sig-space"></div>
          <p><strong>( _____________________ )</strong><br>NIP. -</p>
        </div>
        <div class="signature">
          <p>Maros, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>Ketua Tim Sispaling</p>
          <div class="sig-space"></div>
          <p><strong>( _____________________ )</strong><br>NIS. -</p>
        </div>
      </div>
    </body>
    </html>
  `);
  iframeDoc.close();

  setTimeout(() => {
    try {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
    } catch (e) {
      console.warn('Print iframe error:', e);
    }
  }, 350);
}
