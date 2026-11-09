import { UserSession, SchoolClass, WasteInput, DashboardStats, RankingsResponse } from '../types';
import { firebaseService, auth } from './firebase';

const USER_KEY = 'ecotrack_user';

export const authStorage = {
  getToken(): string | null {
    return auth.currentUser ? 'firebase-token' : localStorage.getItem('ecotrack_token');
  },
  setToken(token: string) {
    localStorage.setItem('ecotrack_token', token);
  },
  getUser(): UserSession | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: UserSession) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem('ecotrack_token');
    localStorage.removeItem(USER_KEY);
  },
};

export const api = {
  // Auth via Firebase Authentication
  async login(usernameOrEmail: string, password: string): Promise<{ token: string; user: UserSession }> {
    const user = await firebaseService.loginWithEmail(usernameOrEmail, password);
    authStorage.setUser(user);
    authStorage.setToken(user.id);
    return { token: user.id, user };
  },

  async loginAsGuest(): Promise<{ token: string; user: UserSession }> {
    const user = await firebaseService.loginAsGuest();
    authStorage.setUser(user);
    authStorage.setToken(user.id);
    return { token: user.id, user };
  },

  async getMe(): Promise<{ user: UserSession }> {
    const cached = authStorage.getUser();
    if (auth.currentUser) {
      const profile = await firebaseService.getUserProfile(auth.currentUser.uid);
      if (profile) {
        authStorage.setUser(profile);
        return { user: profile };
      }
    }
    if (cached) return { user: cached };
    throw new Error('Sesi tidak ditemukan');
  },

  async logout(): Promise<void> {
    await firebaseService.logout();
    authStorage.clear();
  },

  // Classes via Cloud Firestore
  async getClasses(): Promise<SchoolClass[]> {
    return firebaseService.getClasses();
  },

  async createClass(payload: Partial<SchoolClass>): Promise<SchoolClass> {
    return firebaseService.createClass(payload);
  },

  async updateClass(id: string, payload: Partial<SchoolClass>): Promise<SchoolClass> {
    return firebaseService.updateClass(id, payload);
  },

  async deleteClass(id: string): Promise<{ message: string }> {
    await firebaseService.deleteClass(id);
    return { message: 'Kelas berhasil dihapus' };
  },

  // Dashboard & Rankings via Cloud Firestore
  async getDashboardStats(): Promise<DashboardStats> {
    return firebaseService.getDashboardStats();
  },

  async getRankings(filter?: string, _weekOffset?: number): Promise<RankingsResponse> {
    return firebaseService.getRankings(filter);
  },

  // Waste Inputs via Cloud Firestore
  async getInputs(): Promise<WasteInput[]> {
    const all = await firebaseService.getInputs();
    const currentUser = authStorage.getUser();
    if (currentUser?.role === 'petugas') {
      return all.filter((inp) => inp.petugasId === currentUser.id);
    }
    return all;
  },

  async createInput(payload: {
    kelasId: string;
    tanggal: string;
    organik: number;
    anorganik: number;
    b3: number;
    catatan?: string;
  }): Promise<{ message: string; input: WasteInput }> {
    const classes = await firebaseService.getClasses();
    const targetClass = classes.find((c) => c.id === payload.kelasId || c.name === payload.kelasId);
    if (!targetClass) throw new Error('Kelas tidak ditemukan');

    const currentUser = authStorage.getUser();
    const petugasId = auth.currentUser?.uid || currentUser?.id || 'petugas-anonymous';
    const petugasName = currentUser?.nama || 'Petugas Sispaling';

    const input = await firebaseService.createInput({
      kelasId: targetClass.id,
      kelasName: targetClass.name,
      petugasId,
      petugasName,
      petugasKelasAsal: currentUser?.kelasAsal,
      tanggal: payload.tanggal,
      organik: payload.organik,
      anorganik: payload.anorganik,
      b3: payload.b3,
      catatan: payload.catatan,
    });

    return { message: 'Data sampah berhasil dicatat di Cloud Firestore', input };
  },

  async updateInput(
    id: string,
    payload: {
      kelasId?: string;
      tanggal?: string;
      organik?: number;
      anorganik?: number;
      b3?: number;
      catatan?: string;
    }
  ): Promise<{ message: string; input: WasteInput }> {
    let kelasName: string | undefined;
    if (payload.kelasId) {
      const classes = await firebaseService.getClasses();
      const target = classes.find((c) => c.id === payload.kelasId);
      if (target) kelasName = target.name;
    }

    const input = await firebaseService.updateInput(id, {
      ...payload,
      kelasName,
    });

    return { message: 'Data berhasil diperbarui di Cloud Firestore', input };
  },

  async deleteInput(id: string): Promise<{ message: string }> {
    await firebaseService.deleteInput(id);
    return { message: 'Data input berhasil dihapus dari Cloud Firestore' };
  },

  // Admin User Management via Firebase Auth & Firestore
  async getUsers(): Promise<any[]> {
    return firebaseService.getUsers();
  },

  async createUser(payload: { username: string; password: string; nama: string; kelasAsal: string }): Promise<any> {
    return firebaseService.createUser(payload);
  },

  async updateUser(id: string, payload: any): Promise<any> {
    await firebaseService.updateUser(id, payload);
    return { message: 'Data petugas berhasil diperbarui' };
  },

  async deleteUser(id: string): Promise<any> {
    await firebaseService.deleteUser(id);
    return { message: 'Akun petugas berhasil dihapus' };
  },

  async changeAdminPassword(_oldPassword: string, _newPassword: string): Promise<{ message: string }> {
    return { message: 'Password admin dapat diubah di Firebase Console Authentication' };
  },

  async resetSemester(_confirmationText: string, _targetSemester?: string): Promise<{ message: string }> {
    const deletedCount = await firebaseService.resetSemester();
    return {
      message: `Reset semester berhasil. ${deletedCount} catatan sampah dibersihkan dari Cloud Firestore.`,
    };
  },
};
