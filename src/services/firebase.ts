import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserSession, SchoolClass, WasteInput, DashboardStats, RankingsResponse, RankedClass } from '../types';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID (CRITICAL)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

// Error Handling Specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const rawMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: rawMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));

  let userMsg = rawMsg;
  if (rawMsg.includes('permission-denied') || rawMsg.includes('insufficient permissions')) {
    userMsg = `Izin ditolak server (Missing or insufficient permissions). Pastikan Anda telah login sebagai Admin untuk melakukan ${operationType} pada ${path || 'data'}.`;
  } else if (rawMsg.includes('not-found')) {
    userMsg = `Data tidak ditemukan di database (${path || 'dokumen'}).`;
  } else if (rawMsg.includes('offline') || rawMsg.includes('client is offline') || rawMsg.includes('network')) {
    userMsg = 'Koneksi database terputus. Harap periksa jaringan internet Anda.';
  }

  const customError = new Error(userMsg);
  (customError as any).firestoreInfo = errInfo;
  throw customError;
}

// Test Connection on Boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Initial Default Classes for SMAN 11 Maros
const DEFAULT_CLASSES: SchoolClass[] = [
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

export const firebaseService = {
  // --- AUTH SERVICES ---
  async loginWithEmail(identifier: string, password: string): Promise<UserSession> {
    // If user enters a username without @, automatically format with school domain
    let email = identifier.trim().toLowerCase();
    if (!email.includes('@')) {
      email = `${email}@sman11maros.sch.id`;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;

      const isAdminEmail =
        email === 'sispaling26@sman11maros.sch.id' ||
        email === 'yusrilezril@gmail.com' ||
        identifier.trim().toLowerCase() === 'sispaling26';

      // If it is admin, ALWAYS write/merge role: admin to /users/{uid} and /admins/{uid}
      if (isAdminEmail) {
        const adminProfile: UserSession = {
          id: fbUser.uid,
          username: 'sispaling26',
          nama: 'Pembina Sispaling / Admin',
          role: 'admin',
        };
        try {
          await setDoc(
            doc(db, 'users', fbUser.uid),
            {
              id: fbUser.uid,
              email: fbUser.email || email,
              username: 'sispaling26',
              nama: 'Pembina Sispaling / Admin',
              role: 'admin',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          await setDoc(
            doc(db, 'admins', fbUser.uid),
            {
              id: fbUser.uid,
              email: fbUser.email || email,
              role: 'admin',
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (setErr) {
          console.warn('Warning updating admin profile doc:', setErr);
        }
        return adminProfile;
      }

      // Fetch user profile from Firestore /users/{uid}
      let profile = await this.getUserProfile(fbUser.uid);
      if (!profile) {
        profile = {
          id: fbUser.uid,
          username: identifier.split('@')[0],
          nama: fbUser.displayName || identifier.split('@')[0],
          role: 'petugas',
          kelasAsal: 'X-1',
        };
        await this.setUserProfile(fbUser.uid, {
          id: fbUser.uid,
          email: fbUser.email || email,
          username: profile.username,
          nama: profile.nama,
          role: profile.role,
          kelasAsal: profile.kelasAsal || '',
          createdAt: new Date().toISOString(),
        });
      }

      return profile;
    } catch (err: any) {
      // If user not found and it's default admin 'sispaling26', auto-register it to Firebase Auth!
      if (
        (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') &&
        email === 'sispaling26@sman11maros.sch.id'
      ) {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, email, password);
          const fbUser = newCred.user;
          const adminProfile: UserSession = {
            id: fbUser.uid,
            username: 'sispaling26',
            nama: 'Pembina Sispaling / Admin',
            role: 'admin',
          };
          await this.setUserProfile(fbUser.uid, {
            id: fbUser.uid,
            email,
            username: 'sispaling26',
            nama: adminProfile.nama,
            role: 'admin',
            createdAt: new Date().toISOString(),
          });
          try {
            await setDoc(doc(db, 'admins', fbUser.uid), { email, role: 'admin', createdAt: new Date().toISOString() });
          } catch (e) {}
          return adminProfile;
        } catch (regErr: any) {
          throw new Error('Gagal login: ' + (regErr.message || 'Username atau password salah'));
        }
      }
      throw new Error(err.message?.includes('invalid-credential') ? 'Username/Email atau password salah' : (err.message || 'Gagal login'));
    }
  },

  async loginAsGuest(): Promise<UserSession> {
    try {
      const cred = await signInAnonymously(auth);
      return {
        id: cred.user.uid,
        username: 'tamu',
        nama: 'Pengunjung (Tamu)',
        role: 'guest',
      };
    } catch {
      // Fallback guest session
      return {
        id: 'guest-' + Date.now(),
        username: 'tamu',
        nama: 'Pengunjung (Tamu)',
        role: 'guest',
      };
    }
  },

  async logout(): Promise<void> {
    await signOut(auth);
  },

  async getUserProfile(uid: string): Promise<UserSession | null> {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      const currentEmail = auth.currentUser?.email?.toLowerCase();
      const isAdminByEmail =
        currentEmail === 'sispaling26@sman11maros.sch.id' || currentEmail === 'yusrilezril@gmail.com';

      if (snap.exists()) {
        const data = snap.data();
        const role = isAdminByEmail ? 'admin' : data.role || 'petugas';
        // If email is admin, make sure Firestore has role admin
        if (isAdminByEmail && data.role !== 'admin') {
          try {
            await setDoc(doc(db, 'users', uid), { role: 'admin' }, { merge: true });
            await setDoc(doc(db, 'admins', uid), { email: currentEmail, role: 'admin' }, { merge: true });
          } catch {}
        }
        return {
          id: uid,
          username: data.username || data.email?.split('@')[0] || (role === 'admin' ? 'sispaling26' : 'petugas'),
          nama: data.nama || (role === 'admin' ? 'Pembina Sispaling / Admin' : 'Petugas Sispaling'),
          role,
          kelasAsal: data.kelasAsal,
        };
      } else if (isAdminByEmail) {
        // Auto-create doc if missing
        const adminProfile: UserSession = {
          id: uid,
          username: 'sispaling26',
          nama: 'Pembina Sispaling / Admin',
          role: 'admin',
        };
        try {
          await setDoc(
            doc(db, 'users', uid),
            {
              id: uid,
              email: currentEmail,
              username: 'sispaling26',
              nama: adminProfile.nama,
              role: 'admin',
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
          await setDoc(doc(db, 'admins', uid), { email: currentEmail, role: 'admin' }, { merge: true });
        } catch {}
        return adminProfile;
      }
      return null;
    } catch (err) {
      console.warn('Error fetching user profile:', err);
      return null;
    }
  },

  async setUserProfile(uid: string, data: any): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), data, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  },

  // --- CLASSES SERVICES ---
  async getClasses(): Promise<SchoolClass[]> {
    try {
      const snap = await getDocs(collection(db, 'classes'));
      if (snap.empty) {
        // Initialize default classes into Firestore
        await this.seedDefaultClasses();
        return DEFAULT_CLASSES;
      }
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SchoolClass, 'id'>) }));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'classes');
    }
  },

  async seedDefaultClasses(): Promise<void> {
    try {
      const batch = writeBatch(db);
      for (const cls of DEFAULT_CLASSES) {
        const ref = doc(db, 'classes', cls.id);
        batch.set(ref, cls);
      }
      await batch.commit();
    } catch (e) {
      console.error('Failed to seed classes:', e);
    }
  },

  async createClass(payload: Partial<SchoolClass>): Promise<SchoolClass> {
    const id = 'c-' + Date.now();
    const newClass: SchoolClass = {
      id,
      name: payload.name!.trim(),
      tingkat: payload.tingkat || 'X',
      waliKelas: payload.waliKelas?.trim() || '',
      jumlahSiswa: payload.jumlahSiswa || 36,
    };
    try {
      await setDoc(doc(db, 'classes', id), newClass);
      return newClass;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `classes/${id}`);
    }
  },

  async updateClass(id: string, payload: Partial<SchoolClass>): Promise<SchoolClass> {
    try {
      await updateDoc(doc(db, 'classes', id), payload as any);
      const snap = await getDoc(doc(db, 'classes', id));
      return { id: snap.id, ...(snap.data() as any) };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `classes/${id}`);
    }
  },

  async deleteClass(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'classes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `classes/${id}`);
    }
  },

  // --- WASTE INPUTS SERVICES ---
  async getInputs(): Promise<WasteInput[]> {
    try {
      const q = query(collection(db, 'inputs'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const now = Date.now();
      return snap.docs.map((d) => {
        const item = d.data() as WasteInput;
        const createdTime = new Date(item.createdAt).getTime();
        const ageHours = (now - createdTime) / (1000 * 60 * 60);
        return {
          ...item,
          id: d.id,
          canEdit: ageHours <= 24,
          hoursRemaining: Math.max(0, Math.round(24 - ageHours)),
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'inputs');
    }
  },

  async createInput(payload: {
    kelasId: string;
    kelasName: string;
    petugasId: string;
    petugasName: string;
    petugasKelasAsal?: string;
    tanggal: string;
    organik: number;
    anorganik: number;
    b3: number;
    catatan?: string;
  }): Promise<WasteInput> {
    const id = 'inp-' + Date.now();
    const total = payload.organik + payload.anorganik + payload.b3;
    const newInput: WasteInput = {
      id,
      kelasId: payload.kelasId,
      kelasName: payload.kelasName,
      petugasId: payload.petugasId,
      petugasName: payload.petugasName,
      tanggal: payload.tanggal,
      organik: payload.organik,
      anorganik: payload.anorganik,
      b3: payload.b3,
      total,
      catatan: payload.catatan?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'inputs', id), newInput);
      return newInput;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `inputs/${id}`);
    }
  },

  async updateInput(
    id: string,
    payload: {
      kelasId?: string;
      kelasName?: string;
      tanggal?: string;
      organik?: number;
      anorganik?: number;
      b3?: number;
      catatan?: string;
    }
  ): Promise<WasteInput> {
    try {
      const snap = await getDoc(doc(db, 'inputs', id));
      if (!snap.exists()) throw new Error('Data input tidak ditemukan');
      const existing = snap.data() as WasteInput;

      const org = payload.organik !== undefined ? payload.organik : existing.organik;
      const anorg = payload.anorganik !== undefined ? payload.anorganik : existing.anorganik;
      const b3Val = payload.b3 !== undefined ? payload.b3 : existing.b3;
      const total = org + anorg + b3Val;

      const updates: any = {
        ...payload,
        organik: org,
        anorganik: anorg,
        b3: b3Val,
        total,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'inputs', id), updates);
      return { ...existing, ...updates, id };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `inputs/${id}`);
    }
  },

  async deleteInput(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'inputs', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `inputs/${id}`);
    }
  },

  // --- STATS & RANKINGS CALCULATIONS DIRECT FROM FIRESTORE ---
  async getDashboardStats(): Promise<DashboardStats> {
    const [classes, inputs] = await Promise.all([this.getClasses(), this.getInputs()]);

    const totalSampah = inputs.reduce((sum, item) => sum + (item.total || 0), 0);
    const totalOrganik = inputs.reduce((sum, item) => sum + (item.organik || 0), 0);
    const totalAnorganik = inputs.reduce((sum, item) => sum + (item.anorganik || 0), 0);
    const totalB3 = inputs.reduce((sum, item) => sum + (item.b3 || 0), 0);
    const totalTransaksi = inputs.length;
    const uniqueClassesWithInput = new Set(inputs.map((inp) => inp.kelasName)).size;

    // Users count
    let totalPetugas = 3;
    try {
      const uSnap = await getDocs(collection(db, 'users'));
      totalPetugas = uSnap.docs.filter((d) => d.data().role === 'petugas').length || 3;
    } catch {}

    // Daily trend
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

    // Stacked bar chart for all classes
    const classBreakdown = classes.map((cls) => {
      const cInputs = inputs.filter((inp) => inp.kelasId === cls.id || inp.kelasName === cls.name);
      const org = cInputs.reduce((acc, curr) => acc + curr.organik, 0);
      const anorg = cInputs.reduce((acc, curr) => acc + curr.anorganik, 0);
      const b3 = cInputs.reduce((acc, curr) => acc + curr.b3, 0);
      return {
        kelasId: cls.id,
        kelasName: cls.name,
        organik: org,
        anorganik: anorg,
        b3,
        total: org + anorg + b3,
      };
    });

    return {
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
    };
  },

  async getRankings(filter?: string): Promise<RankingsResponse> {
    const [classes, allInputs] = await Promise.all([this.getClasses(), this.getInputs()]);

    let inputs = [...allInputs];
    let weekStartStr = '';
    let weekEndStr = '';

    if (filter === 'this_week') {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const friday = new Date(monday);
      friday.setDate(friday.getDate() + 4);

      weekStartStr = monday.toISOString().split('T')[0];
      weekEndStr = friday.toISOString().split('T')[0];

      inputs = inputs.filter((inp) => inp.tanggal >= weekStartStr && inp.tanggal <= weekEndStr);
    }

    const classScores = classes.map((cls) => {
      const cInputs = inputs.filter((inp) => inp.kelasId === cls.id || inp.kelasName === cls.name);
      const org = cInputs.reduce((acc, curr) => acc + curr.organik, 0);
      const anorg = cInputs.reduce((acc, curr) => acc + curr.anorganik, 0);
      const b3 = cInputs.reduce((acc, curr) => acc + curr.b3, 0);
      const total = org + anorg + b3;
      return {
        kelasId: cls.id,
        kelasName: cls.name,
        organik: org,
        anorganik: anorg,
        b3,
        total,
        inputCount: cInputs.length,
      };
    });

    // 1. Cleanest
    const cleanestSorted = [...classScores].sort((a, b) => a.total - b.total);
    let currentRank = 1;
    const cleanestRanked = cleanestSorted.map((item, index) => {
      if (index > 0 && item.total > cleanestSorted[index - 1].total) {
        currentRank = index + 1;
      }
      return { ...item, rank: currentRank };
    });

    // 2. Dirtiest (Most waste)
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

    return {
      filter: filter || 'all_time',
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      cleanestRanked,
      dirtiestRanked,
    };
  },

  // --- USER MANAGEMENT (Admin) ---
  async getUsers(): Promise<any[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    }
  },

  async createUser(payload: { username: string; password: string; nama: string; kelasAsal: string }): Promise<any> {
    const email = payload.username.includes('@') ? payload.username.toLowerCase() : `${payload.username.toLowerCase()}@sman11maros.sch.id`;
    try {
      // Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, payload.password);
      const uid = cred.user.uid;
      const profile = {
        id: uid,
        email,
        username: payload.username,
        nama: payload.nama,
        role: 'petugas',
        kelasAsal: payload.kelasAsal,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', uid), profile);
      return profile;
    } catch (err: any) {
      throw new Error(err.message || 'Gagal membuat akun di Firebase');
    }
  },

  async updateUser(id: string, payload: any): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }
  },

  async resetSemester(): Promise<number> {
    try {
      const snap = await getDocs(collection(db, 'inputs'));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
      return snap.size;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'inputs');
    }
  },
};
