import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  nama: string;
  role: 'admin' | 'petugas';
  kelasAsal?: string; // Only for petugas
  createdAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  tingkat: 'X' | 'XI' | 'XII';
  waliKelas?: string;
  jumlahSiswa?: number; // approx 36
}

export interface WasteInput {
  id: string;
  kelasId: string;
  kelasName: string;
  petugasId: string;
  petugasName: string;
  tanggal: string; // YYYY-MM-DD
  organik: number; // biji
  anorganik: number; // biji
  b3: number; // biji
  total: number; // biji
  catatan?: string;
  createdAt: string; // ISO string
  updatedAt?: string;
}

export interface DatabaseSchema {
  users: User[];
  classes: SchoolClass[];
  inputs: WasteInput[];
  settings: {
    adminUsername: string;
    appName: string;
    schoolName: string;
    semester: string;
    tahunAjaran: string;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Helper to hash passwords using PBKDF2
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculated = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return calculated === hash;
}

// Generate default initial data
function getDefaultData(): DatabaseSchema {
  const adminAuth = hashPassword('admin123');

  const classes: SchoolClass[] = [
    { id: 'c-x1', name: 'X-1', tingkat: 'X', jumlahSiswa: 36 },
    { id: 'c-x2', name: 'X-2', tingkat: 'X', jumlahSiswa: 36 },
    { id: 'c-x3', name: 'X-3', tingkat: 'X', jumlahSiswa: 36 },
    { id: 'c-x4', name: 'X-4', tingkat: 'X', jumlahSiswa: 36 },
    { id: 'c-x5', name: 'X-5', tingkat: 'X', jumlahSiswa: 36 },
    { id: 'c-xi-mipa1', name: 'XI-MIPA 1', tingkat: 'XI', jumlahSiswa: 36 },
    { id: 'c-xi-mipa2', name: 'XI-MIPA 2', tingkat: 'XI', jumlahSiswa: 36 },
    { id: 'c-xi-ips1', name: 'XI-IPS 1', tingkat: 'XI', jumlahSiswa: 36 },
    { id: 'c-xi-ips2', name: 'XI-IPS 2', tingkat: 'XI', jumlahSiswa: 36 },
    { id: 'c-xii-mipa1', name: 'XII-MIPA 1', tingkat: 'XII', jumlahSiswa: 36 },
    { id: 'c-xii-mipa2', name: 'XII-MIPA 2', tingkat: 'XII', jumlahSiswa: 36 },
    { id: 'c-xii-ips1', name: 'XII-IPS 1', tingkat: 'XII', jumlahSiswa: 36 },
    { id: 'c-xii-ips2', name: 'XII-IPS 2', tingkat: 'XII', jumlahSiswa: 36 },
  ];

  const users: User[] = [
    {
      id: 'u-admin',
      username: 'sispaling26',
      passwordHash: adminAuth.hash,
      salt: adminAuth.salt,
      nama: 'Pembina Sispaling / Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ];

  const inputs: WasteInput[] = [];

  return {
    users,
    classes,
    inputs,
    settings: {
      adminUsername: 'sispaling26',
      appName: 'EcoTrack Sispaling',
      schoolName: 'SMA Negeri 11 Maros',
      semester: 'Ganjil',
      tahunAjaran: '2026/2027',
    },
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.error('Error loading database, initializing default:', err);
    }
    const defaultData = getDefaultData();
    this.save(defaultData);
    return defaultData;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public saveChanges() {
    this.save();
  }

  public resetSemester(): void {
    // Reset inputs only, keep users and classes
    this.data.inputs = [];
    this.save();
  }

  public resetAllToDefault(): void {
    this.data = getDefaultData();
    this.save();
  }
}

export const db = new Database();
