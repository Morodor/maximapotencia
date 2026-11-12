import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyB6m3ed6Wt1bCpP0tcyPf_YklreiEqB4OE",
  authDomain: "maximapotencia-bd31e.firebaseapp.com",
  projectId: "maximapotencia-bd31e",
  storageBucket: "maximapotencia-bd31e.firebasestorage.app",
  messagingSenderId: "629587208455",
  appId: "1:629587208455:web:22610831920d871f5bfda2",
  measurementId: "G-N8W9WKEY6X"
};

export const DEFAULT_GYM_ID = "oXaFQadDDaLQbTO0k9dL";

export const getActiveGymId = () => {
  try {
    return localStorage.getItem('mp_active_gym_id') || DEFAULT_GYM_ID;
  } catch {
    return DEFAULT_GYM_ID;
  }
};

export const setActiveGymId = (gymId) => {
  try {
    localStorage.setItem('mp_active_gym_id', gymId);
  } catch (e) {
    console.error('Error al guardar active gym ID:', e);
  }
};

export const GYM_ID = getActiveGymId();

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Inicializar Firestore con Caché Offline Persistente en Disco
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch {
  firestoreDb = getFirestore(app);
}
export const db = firestoreDb;

// Generador dinámico de referencias por gimnasio (Multi-tenancy)
export const getGymRefs = (gymId = getActiveGymId()) => ({
  gymId,
  athletesRef: collection(db, `gyms/${gymId}/athletes`),
  groupsRef: collection(db, `gyms/${gymId}/groups`),
  coachesRef: collection(db, `gyms/${gymId}/coaches`),
  rmRecordsRef: collection(db, `gyms/${gymId}/rmRecords`),
  powerRecordsRef: collection(db, `gyms/${gymId}/powerRecords`),
  sessionsRef: collection(db, `gyms/${gymId}/sessions`),
  exercisesDocRef: doc(db, `gyms/${gymId}/user_data/exercises`),
  profileDocRef: doc(db, `gyms/${gymId}/user_data/profile`),
  inventoryDocRef: doc(db, `gyms/${gymId}/user_data/inventory`),
  appUpdateDocRef: doc(db, `gyms/${gymId}/system/app_update`)
});

// Referencias activas por defecto (retrocompatibilidad completa)
const defaultRefs = getGymRefs(DEFAULT_GYM_ID);
export const athletesRef = defaultRefs.athletesRef;
export const groupsRef = defaultRefs.groupsRef;
export const coachesRef = defaultRefs.coachesRef;
export const rmRecordsRef = defaultRefs.rmRecordsRef;
export const powerRecordsRef = defaultRefs.powerRecordsRef;
export const sessionsRef = defaultRefs.sessionsRef;
export const exercisesDocRef = defaultRefs.exercisesDocRef;
export const profileDocRef = defaultRefs.profileDocRef;
export const inventoryDocRef = defaultRefs.inventoryDocRef;
export const appUpdateDocRef = defaultRefs.appUpdateDocRef;

export { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  serverTimestamp, 
  writeBatch,
  query,
  orderBy,
  limit,
  where,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
};
