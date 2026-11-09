import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword, verifyPassword, User, WasteInput, SchoolClass } from './server/db.ts';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-memory token store for active sessions
interface Session {
  token: string;
  userId: string;
  username: string;
  nama: string;
  role: 'admin' | 'petugas' | 'guest';
  kelasAsal?: string;
  expiresAt: number;
}

const sessions = new Map<string, Session>();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: Session;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token tidak ditemukan' });
  }

  const token = authHeader.substring(7);
  const session = sessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(token);
    return res.status(401).json({ error: 'Sesi telah kedaluwarsa atau tidak valid. Silakan login kembali.' });
  }

  req.user = session;
  next();
}

function requireRole(allowedRoles: ('admin' | 'petugas' | 'guest')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.' });
    }
    next();
  };
}

// --- AUTH ROUTES ---

// POST /api/auth/login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  const data = db.getData();
  const user = data.users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());

  if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }

  const token = generateToken();
  const session: Session = {
    token,
    userId: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    kelasAsal: user.kelasAsal,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  sessions.set(token, session);

  res.json({
    message: 'Login berhasil',
    token,
    user: {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      kelasAsal: user.kelasAsal,
    },
  });
});

// POST /api/auth/guest
app.post('/api/auth/guest', (_req: Request, res: Response) => {
  const token = generateToken();
  const session: Session = {
    token,
    userId: 'guest-' + Date.now(),
    username: 'tamu',
    nama: 'Pengunjung (Tamu)',
    role: 'guest',
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 1 day
  };
  sessions.set(token, session);

  res.json({
    message: 'Masuk sebagai Tamu berhasil',
    token,
    user: {
      id: session.userId,
      username: session.username,
      nama: session.nama,
      role: 'guest',
    },
  });
});

// GET /api/auth/me
app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
app.post('/api/auth/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    sessions.delete(req.user.token);
  }
  res.json({ message: 'Logout berhasil' });
});

// --- CLASSES ROUTES ---

// GET /api/classes (Public or authenticated)
app.get('/api/classes', (_req: Request, res: Response) => {
  const data = db.getData();
  res.json(data.classes);
});

// POST /api/classes (Admin only)
app.post('/api/classes', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { name, tingkat, waliKelas, jumlahSiswa } = req.body;
  if (!name || !tingkat) {
    return res.status(400).json({ error: 'Nama kelas dan tingkat wajib diisi' });
  }

  const data = db.getData();
  if (data.classes.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Kelas dengan nama tersebut sudah ada' });
  }

  const newClass: SchoolClass = {
    id: 'c-' + Date.now(),
    name: name.trim(),
    tingkat: tingkat as 'X' | 'XI' | 'XII',
    waliKelas: waliKelas?.trim(),
    jumlahSiswa: jumlahSiswa ? parseInt(jumlahSiswa, 10) : 36,
  };

  data.classes.push(newClass);
  db.saveChanges();

  res.status(201).json(newClass);
});

// PUT /api/classes/:id (Admin only)
app.put('/api/classes/:id', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, tingkat, waliKelas, jumlahSiswa } = req.body;

  const data = db.getData();
  const cls = data.classes.find((c) => c.id === id);
  if (!cls) return res.status(404).json({ error: 'Kelas tidak ditemukan' });

  const oldName = cls.name;
  if (name && name.trim()) {
    cls.name = name.trim();
    // Update existing inputs if class name changed
    data.inputs.forEach((inp) => {
      if (inp.kelasId === id || inp.kelasName === oldName) {
        inp.kelasName = cls.name;
      }
    });
  }
  if (tingkat) cls.tingkat = tingkat;
  if (waliKelas !== undefined) cls.waliKelas = waliKelas.trim();
  if (jumlahSiswa !== undefined) cls.jumlahSiswa = parseInt(jumlahSiswa, 10);

  db.saveChanges();
  res.json(cls);
});

// DELETE /api/classes/:id (Admin only)
app.delete('/api/classes/:id', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const index = data.classes.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Kelas tidak ditemukan' });

  data.classes.splice(index, 1);
  db.saveChanges();
  res.json({ message: 'Kelas berhasil dihapus' });
});

// --- DASHBOARD & STATS ROUTES ---

app.get('/api/dashboard/stats', authMiddleware, (_req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const inputs = data.inputs;
  const classes = data.classes;
  const users = data.users;

  // 1. Total waste (biji)
  const totalSampah = inputs.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalOrganik = inputs.reduce((sum, item) => sum + (item.organik || 0), 0);
  const totalAnorganik = inputs.reduce((sum, item) => sum + (item.anorganik || 0), 0);
  const totalB3 = inputs.reduce((sum, item) => sum + (item.b3 || 0), 0);

  // 2. Total transaksi (jumlah data input)
  const totalTransaksi = inputs.length;

  // 3. Jumlah kelas yang sudah menyetor
  const uniqueClassesWithInput = new Set(inputs.map((inp) => inp.kelasName)).size;

  // 4. Jumlah petugas tercatat
  const totalPetugas = users.filter((u) => u.role === 'petugas').length;

  // 5. Daily trend data
  const dateMap = new Map<string, { tanggal: string; total: number; organik: number; anorganik: number; b3: number }>();
  inputs.forEach((inp) => {
    const existing = dateMap.get(inp.tanggal) || {
      tanggal: inp.tanggal,
      total: 0,
      organik: 0,
      anorganik: 0,
      b3: 0,
    };
    existing.total += inp.total;
    existing.organik += inp.organik;
    existing.anorganik += inp.anorganik;
    existing.b3 += inp.b3;
    dateMap.set(inp.tanggal, existing);
  });
  const dailyData = Array.from(dateMap.values()).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  // 6. Monthly/All-time stacked bar data per class (all classes, stacked Organik, Anorganik, B3)
  const classBreakdown = classes.map((cls) => {
    const classInputs = inputs.filter((inp) => inp.kelasId === cls.id || inp.kelasName === cls.name);
    const org = classInputs.reduce((acc, curr) => acc + curr.organik, 0);
    const anorg = classInputs.reduce((acc, curr) => acc + curr.anorganik, 0);
    const b3 = classInputs.reduce((acc, curr) => acc + curr.b3, 0);
    return {
      kelasId: cls.id,
      kelasName: cls.name,
      organik: org,
      anorganik: anorg,
      b3,
      total: org + anorg + b3,
    };
  });

  res.json({
    summary: {
      totalSampah,
      totalOrganik,
      totalAnorganik,
      totalB3,
      totalTransaksi,
      kelasMenyetor: uniqueClassesWithInput,
      totalKelas: classes.length,
      totalPetugas,
    },
    dailyData,
    classBreakdown,
  });
});

// --- RANKINGS & CEREMONY RECAP ROUTES ---

// Helper function to get Monday of a date
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

app.get('/api/rankings', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { filter, weekOffset } = req.query; // 'this_week', 'all_time', or week offset
  const data = db.getData();
  const classes = data.classes;
  let inputs = [...data.inputs];

  // Optional week filter
  let weekStartStr = '';
  let weekEndStr = '';
  if (filter === 'this_week' || weekOffset !== undefined) {
    const offsetNum = weekOffset ? parseInt(weekOffset as string, 10) : 0;
    const now = new Date();
    now.setDate(now.getDate() + offsetNum * 7);
    const monday = getMonday(now);
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);

    weekStartStr = monday.toISOString().split('T')[0];
    weekEndStr = friday.toISOString().split('T')[0];

    inputs = inputs.filter((inp) => inp.tanggal >= weekStartStr && inp.tanggal <= weekEndStr);
  }

  // Calculate totals per class
  const classScores = classes.map((cls) => {
    const classInputs = inputs.filter((inp) => inp.kelasId === cls.id || inp.kelasName === cls.name);
    const organik = classInputs.reduce((acc, curr) => acc + curr.organik, 0);
    const anorganik = classInputs.reduce((acc, curr) => acc + curr.anorganik, 0);
    const b3 = classInputs.reduce((acc, curr) => acc + curr.b3, 0);
    const total = organik + anorganik + b3;
    const inputCount = classInputs.length;
    return {
      kelasId: cls.id,
      kelasName: cls.name,
      organik,
      anorganik,
      b3,
      total,
      inputCount,
    };
  });

  // Ranking 1: Kelas Terbersih (Least waste first)
  // Ties rule: if total is same, rank is same (seri)
  const cleanestSorted = [...classScores].sort((a, b) => a.total - b.total);
  let currentRank = 1;
  const cleanestRanked = cleanestSorted.map((item, index) => {
    if (index > 0 && item.total > cleanestSorted[index - 1].total) {
      currentRank = index + 1;
    }
    return {
      ...item,
      rank: currentRank,
    };
  });

  // Ranking 2: Kelas dengan Sampah Terbanyak (Most waste first)
  // Top 3 classes with most waste are flagged with sanction
  const dirtiestSorted = [...classScores].sort((a, b) => b.total - a.total);
  let dirtiestRank = 1;
  const dirtiestRanked = dirtiestSorted.map((item, index) => {
    if (index > 0 && item.total < dirtiestSorted[index - 1].total) {
      dirtiestRank = index + 1;
    }
    const isTop3 = dirtiestRank <= 3 && item.total > 0;
    return {
      ...item,
      rank: dirtiestRank,
      kenaSanksi: isTop3,
      sanksiJenis: isTop3 ? (dirtiestRank === 1 ? 'Kerja Bakti Lapangan Utama & Denda Sampah' : 'Kerja Bakti Area Selasar') : null,
    };
  });

  res.json({
    filter: filter || 'all_time',
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    cleanestRanked,
    dirtiestRanked,
  });
});

// --- WASTE INPUTS CRUD ROUTES ---

// GET /api/inputs
// Petugas sees ONLY their own inputs; Admin sees all; Guest cannot access
app.get('/api/inputs', authMiddleware, requireRole(['admin', 'petugas']), (req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const user = req.user!;

  if (user.role === 'admin') {
    // Admin sees all
    const sorted = [...data.inputs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(sorted);
  }

  // Petugas: STRICT SERVER ENFORCEMENT - only see inputs where petugasId matches
  const officerInputs = data.inputs
    .filter((inp) => inp.petugasId === user.userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Also include flag if editable (within 24h)
  const now = Date.now();
  const enriched = officerInputs.map((inp) => {
    const ageHours = (now - new Date(inp.createdAt).getTime()) / (1000 * 60 * 60);
    return {
      ...inp,
      canEdit: ageHours <= 24,
      hoursRemaining: Math.max(0, Math.round(24 - ageHours)),
    };
  });

  res.json(enriched);
});

// POST /api/inputs (Petugas & Admin)
app.post('/api/inputs', authMiddleware, requireRole(['admin', 'petugas']), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { kelasId, tanggal, organik, anorganik, b3, catatan } = req.body;

  if (!kelasId || !tanggal) {
    return res.status(400).json({ error: 'Kelas dan tanggal wajib dipilih' });
  }

  const data = db.getData();
  const targetClass = data.classes.find((c) => c.id === kelasId || c.name === kelasId);
  if (!targetClass) {
    return res.status(400).json({ error: 'Kelas tidak valid atau tidak ditemukan' });
  }

  // Rule 5: Petugas cannot input their own class!
  if (user.role === 'petugas' && user.kelasAsal) {
    if (
      targetClass.name.toLowerCase() === user.kelasAsal.toLowerCase() ||
      targetClass.id.toLowerCase() === user.kelasAsal.toLowerCase()
    ) {
      return res.status(403).json({
        error: `Pelanggaran aturan: Petugas tidak boleh menginput data kelasnya sendiri (${user.kelasAsal}).`,
      });
    }
  }

  // Rule 5: Hari input Senin sampai Jumat
  const inputDate = new Date(tanggal + 'T12:00:00');
  const dayOfWeek = inputDate.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.status(400).json({
      error: 'Pencatatan sampah hanya berlaku pada hari sekolah aktif (Senin sampai Jumat).',
    });
  }

  // Valid non-negative numbers
  const orgCount = Math.max(0, parseInt(organik, 10) || 0);
  const anorgCount = Math.max(0, parseInt(anorganik, 10) || 0);
  const b3Count = Math.max(0, parseInt(b3, 10) || 0);
  const totalCount = orgCount + anorgCount + b3Count;

  const newInput: WasteInput = {
    id: 'inp-' + Date.now(),
    kelasId: targetClass.id,
    kelasName: targetClass.name,
    petugasId: user.userId,
    petugasName: user.nama,
    tanggal,
    organik: orgCount,
    anorganik: anorgCount,
    b3: b3Count,
    total: totalCount,
    catatan: catatan?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  data.inputs.unshift(newInput);
  db.saveChanges();

  res.status(201).json({
    message: 'Data sampah berhasil dicatat',
    input: newInput,
  });
});

// PUT /api/inputs/:id (Petugas within 24h OR Admin anytime)
app.put('/api/inputs/:id', authMiddleware, requireRole(['admin', 'petugas']), (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { kelasId, tanggal, organik, anorganik, b3, catatan } = req.body;

  const data = db.getData();
  const input = data.inputs.find((i) => i.id === id);
  if (!input) {
    return res.status(404).json({ error: 'Data input tidak ditemukan' });
  }

  // Petugas restrictions
  if (user.role === 'petugas') {
    // 1. Must be their own input
    if (input.petugasId !== user.userId) {
      return res.status(403).json({ error: 'Akses ditolak: Anda hanya dapat mengedit data input milik Anda sendiri.' });
    }

    // 2. Must be within 24 hours of creation
    const now = Date.now();
    const createdTime = new Date(input.createdAt).getTime();
    const hoursElapsed = (now - createdTime) / (1000 * 60 * 60);

    if (hoursElapsed > 24) {
      return res.status(403).json({
        error: 'Data terkunci! Batas waktu 1 hari (24 jam) untuk mengedit data ini telah habis. Silakan hubungi Admin.',
      });
    }

    // 3. If updating class, cannot pick own class
    if (kelasId) {
      const targetClass = data.classes.find((c) => c.id === kelasId || c.name === kelasId);
      if (
        targetClass &&
        user.kelasAsal &&
        (targetClass.name.toLowerCase() === user.kelasAsal.toLowerCase() ||
          targetClass.id.toLowerCase() === user.kelasAsal.toLowerCase())
      ) {
        return res.status(403).json({ error: `Petugas tidak boleh menginput kelasnya sendiri (${user.kelasAsal}).` });
      }
    }
  }

  // Apply updates
  if (kelasId) {
    const targetClass = data.classes.find((c) => c.id === kelasId || c.name === kelasId);
    if (targetClass) {
      input.kelasId = targetClass.id;
      input.kelasName = targetClass.name;
    }
  }

  if (tanggal) {
    const inputDate = new Date(tanggal + 'T12:00:00');
    const dayOfWeek = inputDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ error: 'Tanggal harus hari aktif sekolah (Senin - Jumat).' });
    }
    input.tanggal = tanggal;
  }

  if (organik !== undefined) input.organik = Math.max(0, parseInt(organik, 10) || 0);
  if (anorganik !== undefined) input.anorganik = Math.max(0, parseInt(anorganik, 10) || 0);
  if (b3 !== undefined) input.b3 = Math.max(0, parseInt(b3, 10) || 0);
  input.total = input.organik + input.anorganik + input.b3;
  if (catatan !== undefined) input.catatan = catatan.trim();
  input.updatedAt = new Date().toISOString();

  db.saveChanges();
  res.json({ message: 'Data berhasil diperbarui', input });
});

// DELETE /api/inputs/:id (Admin only)
app.delete('/api/inputs/:id', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const index = data.inputs.findIndex((i) => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Data tidak ditemukan' });
  }

  data.inputs.splice(index, 1);
  db.saveChanges();
  res.json({ message: 'Data input berhasil dihapus' });
});

// --- USER & PETUGAS MANAGEMENT ROUTES (Admin only) ---

// GET /api/users
app.get('/api/users', authMiddleware, requireRole(['admin']), (_req: AuthenticatedRequest, res: Response) => {
  const data = db.getData();
  const safeUsers = data.users.map((u) => ({
    id: u.id,
    username: u.username,
    nama: u.nama,
    role: u.role,
    kelasAsal: u.kelasAsal,
    createdAt: u.createdAt,
  }));
  res.json(safeUsers);
});

// POST /api/users (Admin creates petugas)
app.post('/api/users', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { username, password, nama, kelasAsal } = req.body;

  if (!username || !password || !nama || !kelasAsal) {
    return res.status(400).json({ error: 'Semua kolom (username, password, nama, kelas asal) wajib diisi' });
  }

  const data = db.getData();
  if (data.users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Username tersebut sudah digunakan oleh akun lain' });
  }

  const { hash, salt } = hashPassword(password);
  const newUser: User = {
    id: 'u-' + Date.now(),
    username: username.trim().toLowerCase(),
    passwordHash: hash,
    salt,
    nama: nama.trim(),
    role: 'petugas',
    kelasAsal: kelasAsal.trim(),
    createdAt: new Date().toISOString(),
  };

  data.users.push(newUser);
  db.saveChanges();

  res.status(201).json({
    message: 'Akun petugas berhasil dibuat',
    user: {
      id: newUser.id,
      username: newUser.username,
      nama: newUser.nama,
      role: newUser.role,
      kelasAsal: newUser.kelasAsal,
      createdAt: newUser.createdAt,
    },
  });
});

// PUT /api/users/:id (Admin edits petugas)
app.put('/api/users/:id', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { username, password, nama, kelasAsal } = req.body;

  const data = db.getData();
  const user = data.users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  if (username && username.trim().toLowerCase() !== user.username.toLowerCase()) {
    if (data.users.some((u) => u.id !== id && u.username.toLowerCase() === username.trim().toLowerCase())) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }
    user.username = username.trim().toLowerCase();
  }

  if (password && password.trim()) {
    const { hash, salt } = hashPassword(password.trim());
    user.passwordHash = hash;
    user.salt = salt;
  }

  if (nama) user.nama = nama.trim();
  if (kelasAsal) user.kelasAsal = kelasAsal.trim();

  db.saveChanges();
  res.json({
    message: 'Data petugas berhasil diperbarui',
    user: {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      kelasAsal: user.kelasAsal,
    },
  });
});

// DELETE /api/users/:id (Admin deletes petugas)
app.delete('/api/users/:id', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const user = data.users.find((u) => u.id === id);

  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });
  if (user.role === 'admin') {
    return res.status(400).json({ error: 'Akun Admin utama tidak dapat dihapus' });
  }

  const idx = data.users.findIndex((u) => u.id === id);
  data.users.splice(idx, 1);
  db.saveChanges();

  res.json({ message: 'Akun petugas berhasil dihapus' });
});

// PUT /api/admin/password (Admin changes password)
app.put('/api/admin/password', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Password lama dan password baru wajib diisi' });
  }

  const data = db.getData();
  const adminUser = data.users.find((u) => u.id === req.user!.userId || u.role === 'admin');
  if (!adminUser) return res.status(404).json({ error: 'Admin tidak ditemukan' });

  if (!verifyPassword(oldPassword, adminUser.passwordHash, adminUser.salt)) {
    return res.status(400).json({ error: 'Password lama tidak sesuai' });
  }

  const { hash, salt } = hashPassword(newPassword);
  adminUser.passwordHash = hash;
  adminUser.salt = salt;
  db.saveChanges();

  res.json({ message: 'Password admin berhasil diubah' });
});

// POST /api/admin/reset-semester (Admin only - double confirmation)
app.post('/api/admin/reset-semester', authMiddleware, requireRole(['admin']), (req: AuthenticatedRequest, res: Response) => {
  const { confirmationText, targetSemester } = req.body;

  if (confirmationText !== 'RESET DATA SEMESTER') {
    return res.status(400).json({
      error: 'Konfirmasi tidak sesuai. Harap ketik "RESET DATA SEMESTER" dengan tepat untuk mencegah kehilangan data tidak sengaja.',
    });
  }

  const data = db.getData();
  const countBefore = data.inputs.length;
  db.resetSemester();

  if (targetSemester) {
    data.settings.semester = targetSemester;
    db.saveChanges();
  }

  res.json({
    message: `Reset data semester berhasil dilakukan. ${countBefore} catatan sampah telah dibersihkan. Daftar kelas dan akun petugas tetap dipertahankan.`,
  });
});


// --- VITE DEV / PRODUCTION STATIC MOUNTING ---
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // In production, serve dist folder
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // In dev, mount Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server EcoTrack Sispaling berjalan di port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
