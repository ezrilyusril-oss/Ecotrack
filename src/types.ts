export type UserRole = 'admin' | 'petugas' | 'guest';

export interface UserSession {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  kelasAsal?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  tingkat: 'X' | 'XI' | 'XII';
  waliKelas?: string;
  jumlahSiswa?: number;
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
  createdAt: string;
  updatedAt?: string;
  canEdit?: boolean;
  hoursRemaining?: number;
}

export interface DashboardStats {
  summary: {
    totalSampah: number;
    totalOrganik: number;
    totalAnorganik: number;
    totalB3: number;
    totalTransaksi: number;
    kelasMenyetor: number;
    totalKelas: number;
    totalPetugas: number;
  };
  dailyData: Array<{
    tanggal: string;
    total: number;
    organik: number;
    anorganik: number;
    b3: number;
  }>;
  classBreakdown: Array<{
    kelasId: string;
    kelasName: string;
    organik: number;
    anorganik: number;
    b3: number;
    total: number;
  }>;
}

export interface RankedClass {
  kelasId: string;
  kelasName: string;
  organik: number;
  anorganik: number;
  b3: number;
  total: number;
  inputCount: number;
  rank: number;
  kenaSanksi?: boolean;
  sanksiJenis?: string | null;
}

export interface RankingsResponse {
  filter: string;
  weekStart?: string;
  weekEnd?: string;
  cleanestRanked: RankedClass[];
  dirtiestRanked: RankedClass[];
}
