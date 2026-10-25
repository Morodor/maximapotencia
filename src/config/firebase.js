import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  serverTimestamp,
  writeBatch
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

export const GYM_ID = "oXaFQadDDaLQbTO0k9dL";

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Colecciones en la base de datos real del gimnasio
export const athletesRef = collection(db, `gyms/${GYM_ID}/athletes`);
export const groupsRef = collection(db, `gyms/${GYM_ID}/groups`);
export const coachesRef = collection(db, `gyms/${GYM_ID}/coaches`);
export const rmRecordsRef = collection(db, `gyms/${GYM_ID}/rmRecords`);
export const powerRecordsRef = collection(db, `gyms/${GYM_ID}/powerRecords`);
export const sessionsRef = collection(db, `gyms/${GYM_ID}/sessions`);
export const exercisesDocRef = doc(db, `gyms/${GYM_ID}/user_data/exercises`);
export const profileDocRef = doc(db, `gyms/${GYM_ID}/user_data/profile`);
export const inventoryDocRef = doc(db, `gyms/${GYM_ID}/user_data/inventory`);

export { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  serverTimestamp,
  writeBatch
};
