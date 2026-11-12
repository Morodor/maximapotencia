import React, { createContext, useContext, useState, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { 
  getGymRefs,
  getActiveGymId,
  setActiveGymId,
  DEFAULT_GYM_ID,
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  doc,
  db,
  serverTimestamp,
  writeBatch,
  query,
  orderBy,
  limit
} from '../config/firebase';
import { DEFAULT_EXERCISES_DATA } from '../data/defaultExercises';
import { 
  CURRENT_APP_VERSION, 
  DEFAULT_APK_URL,
  isNewerVersion, 
  downloadAndInstallUpdate 
} from '../utils/updateManager';

const AppContext = createContext();

export const AVAILABLE_THEMES = [
  {
    id: 'red',
    name: 'Rojo Potencia',
    subtitle: 'Identidad Clásica',
    colorHex: '#ef4444',
    bgHex: '#09090b',
    surfaceHex: '#121215',
    borderHex: '#292936',
    environmentName: 'Carbón Puro Ónice (Sin azul)',
    description: 'Fondo negro carbón ultra oscuro con acento rojo carmesí de máxima potencia e intensidad.'
  },
  {
    id: 'blue',
    name: 'Azul Eléctrico',
    subtitle: 'Enfoque Atlético',
    colorHex: '#3b82f6',
    bgHex: '#020713',
    surfaceHex: '#081224',
    borderHex: '#1a315b',
    environmentName: 'Midnight Navy Profundo',
    description: 'Fondo azul noche abisal con acentos eléctricos para enfoque atlético y concentración.'
  },
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    subtitle: 'Salud y Vitalidad',
    colorHex: '#10b981',
    bgHex: '#030f0a',
    surfaceHex: '#061b12',
    borderHex: '#164230',
    environmentName: 'Bosque Jade Oscuro',
    description: 'Fondo verde bosque oscuro profundo con acentos jade esmeralda para potencia y resistencia.'
  },
  {
    id: 'purple',
    name: 'Morado Neón',
    subtitle: 'Cyber Pro',
    colorHex: '#8b5cf6',
    bgHex: '#090312',
    surfaceHex: '#120822',
    borderHex: '#2f1952',
    environmentName: 'Cyber Violeta Nocturno',
    description: 'Fondo violeta oscuro futurista con acentos neón de categoría élite.'
  },
  {
    id: 'amber',
    name: 'Oro Olímpico',
    subtitle: 'Fuerza y Récords',
    colorHex: '#f59e0b',
    bgHex: '#0e0903',
    surfaceHex: '#181107',
    borderHex: '#3d2c17',
    environmentName: 'Bronce & Carbón Cálido',
    description: 'Fondo carbón cálido con reflejos bronce y acentos dorados inspirados en el podio olímpico.'
  },
  {
    id: 'cyan',
    name: 'Cian Glaciar',
    subtitle: 'Ciencia y VBT',
    colorHex: '#06b6d4',
    bgHex: '#020d14',
    surfaceHex: '#051822',
    borderHex: '#123b50',
    environmentName: 'Océano Polar Abisal',
    description: 'Fondo océano polar profundo con acentos cian glaciar para tecnología deportiva y ciencia VBT.'
  }
];

export const AppProvider = ({ children }) => {
  const [currentPanel, setCurrentPanel] = useState('dashboard');
  const [athletes, setAthletes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [currentCoachId, setCurrentCoachId] = useState(() => {
    try {
      return localStorage.getItem('mp_active_coach_id') || '';
    } catch (e) {
      return '';
    }
  });
  const [rmRecords, setRmRecords] = useState([]);
  const [powerRecords, setPowerRecords] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState(DEFAULT_EXERCISES_DATA);
  const [profile, setProfile] = useState({ displayName: 'Bayron Quezada', description: 'Atleta / Entrenador' });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [appUpdateInfo, setAppUpdateInfo] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Estados de Autenticación Oficial (Firebase Auth)
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Claves de Almacenamiento Local para Modo Invitado
  const GUEST_STORAGE_KEYS = {
    ATHLETES: 'mp_guest_athletes',
    GROUPS: 'mp_guest_groups',
    RM: 'mp_guest_rm',
    POWER: 'mp_guest_power',
    SESSIONS: 'mp_guest_sessions',
    EXERCISES: 'mp_guest_exercises',
    COACHES: 'mp_guest_coaches'
  };

  const getGuestStorage = (key, fallback = []) => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error(`Error al leer ${key} de localStorage:`, e);
      return fallback;
    }
  };

  const setGuestStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error al escribir ${key} en localStorage:`, e);
    }
  };

  // Modo Invitado y Seguridad Local
  const [isGuestMode, setIsGuestModeState] = useState(() => {
    try {
      return localStorage.getItem('mp_guest_mode') === 'true';
    } catch {
      return false;
    }
  });

  const setGuestMode = (enabled) => {
    try {
      localStorage.setItem('mp_guest_mode', enabled ? 'true' : 'false');
    } catch (e) {}
    setIsGuestModeState(enabled);
    if (enabled) {
      // Cargar registros locales si existen
      const localAth = getGuestStorage(GUEST_STORAGE_KEYS.ATHLETES, null);
      if (localAth !== null) setAthletes(localAth);
      const localGrp = getGuestStorage(GUEST_STORAGE_KEYS.GROUPS, null);
      if (localGrp !== null) setGroups(localGrp);
      const localRm = getGuestStorage(GUEST_STORAGE_KEYS.RM, null);
      if (localRm !== null) setRmRecords(localRm);
      const localPwr = getGuestStorage(GUEST_STORAGE_KEYS.POWER, null);
      if (localPwr !== null) setPowerRecords(localPwr);
      const localSes = getGuestStorage(GUEST_STORAGE_KEYS.SESSIONS, null);
      if (localSes !== null) setSessions(localSes);
      const localEx = getGuestStorage(GUEST_STORAGE_KEYS.EXERCISES, null);
      if (localEx !== null) setExercises(localEx);

      showNotification('Modo Invitado activado. Los registros se guardarán exclusivamente en este dispositivo.');
    } else {
      showNotification('Modo Invitado desactivado. Acceso en modo Solo Lectura.');
    }
  };

  const toggleGuestMode = () => {
    setGuestMode(!isGuestMode);
  };

  const canRegister = Boolean(currentUser || isGuestMode);

  useEffect(() => {
    // Procesar retorno de autenticación por redirección (móviles y navegadores con bloqueo de popup en web)
    getRedirectResult(auth)
      .then((res) => {
        if (res && res.user) {
          showNotification(`¡Sesión iniciada con Google: ${res.user.displayName || res.user.email}!`);
        }
      })
      .catch((err) => {
        console.warn('Redirect auth result warning:', err?.message || err);
      });

    // Listener para app nativa (Android) al recibir el callback maximapotencia://auth-callback
    let appUrlOpenHandle = null;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appUrlOpen', async (data) => {
        try {
          if (!data?.url) return;
          if (data.url.includes('auth-callback')) {
            const queryIndex = data.url.indexOf('?');
            const queryStr = queryIndex !== -1 ? data.url.substring(queryIndex + 1) : '';
            const params = new URLSearchParams(queryStr);
            const idToken = params.get('idToken');
            const accessToken = params.get('accessToken');
            const emailParam = params.get('email');

            // Cerrar la pestaña de Chrome Custom Tab
            await Browser.close().catch(() => {});

            if (idToken || accessToken) {
              const credential = GoogleAuthProvider.credential(idToken || null, accessToken || null);
              const userCred = await signInWithCredential(auth, credential);
              showNotification(`¡Sesión iniciada con Google: ${userCred.user.displayName || userCred.user.email || emailParam}!`);
              setIsAuthModalOpen(false);
            }
          }
        } catch (authErr) {
          console.error('Error al completar inicio de sesión con Google nativo:', authErr);
          showNotification('Error al autenticar con Google en la app: ' + (authErr.message || authErr), true);
        }
      }).then(handle => {
        appUrlOpenHandle = handle;
      });
    }

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setIsGuestModeState(false);
        try {
          localStorage.setItem('mp_guest_mode', 'false');
        } catch (e) {}
      }
    });

    return () => {
      unsubAuth();
      if (appUrlOpenHandle && typeof appUrlOpenHandle.remove === 'function') {
        appUrlOpenHandle.remove();
      }
    };
  }, []);

  const loginWithEmail = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true, user: cred.user };
    } catch (err) {
      return { success: false, error: err.code || err.message };
    }
  };

  const registerWithEmail = async (email, password, displayName) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      return { success: true, user: cred.user };
    } catch (err) {
      return { success: false, error: err.code || err.message };
    }
  };

  const sendResetPassword = async (targetEmail) => {
    try {
      if (!targetEmail || !targetEmail.includes('@')) {
        return { success: false, error: 'Por favor ingresa un correo electrónico válido.' };
      }
      await sendPasswordResetEmail(auth, targetEmail.trim());
      return { success: true };
    } catch (err) {
      return { success: false, error: err.code || err.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      // En la app nativa instalada (Capacitor Android), abrimos el puente seguro en Firebase Hosting
      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url: 'https://maximapotencia-bd31e.firebaseapp.com/google-auth.html',
          windowName: '_self'
        });
        return { success: true, redirecting: true };
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      // En móviles web, signInWithRedirect evita que el navegador se quede en blanco en /__/auth/handler
      const isMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) || window.innerWidth < 768;

      if (isMobileDevice) {
        await signInWithRedirect(auth, provider);
        return { success: true, redirecting: true };
      }

      try {
        const cred = await signInWithPopup(auth, provider);
        return { success: true, user: cred.user };
      } catch (popupErr) {
        if (
          popupErr.code === 'auth/popup-blocked' || 
          popupErr.code === 'auth/cancelled-popup-request' ||
          popupErr.code === 'auth/popup-closed-by-user'
        ) {
          console.warn('Popup bloqueado o no soportado, iniciando redirección:', popupErr);
          await signInWithRedirect(auth, provider);
          return { success: true, redirecting: true };
        }
        throw popupErr;
      }
    } catch (err) {
      return { success: false, error: err.code || err.message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      return true;
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      return false;
    }
  };

  // Migrar datos locales de invitado a la cuenta en la nube
  const migrateGuestDataToCloud = async () => {
    if (!currentUser) {
      showNotification('Debes iniciar sesión con tu cuenta para subir los datos locales a la nube.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    try {
      const localAth = getGuestStorage(GUEST_STORAGE_KEYS.ATHLETES, []);
      const localRm = getGuestStorage(GUEST_STORAGE_KEYS.RM, []);
      const localPwr = getGuestStorage(GUEST_STORAGE_KEYS.POWER, []);
      const localSes = getGuestStorage(GUEST_STORAGE_KEYS.SESSIONS, []);

      let count = 0;
      const athleteIdMap = {};

      const refs = getGymRefs(activeGymId);

      // Migrar Atletas
      for (const ath of localAth) {
        const { id, isGuestRecord, ...cleanData } = ath;
        const ref = await addDoc(refs.athletesRef, {
          ...cleanData,
          migratedFromGuest: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        athleteIdMap[id] = ref.id;
        count++;
      }

      // Migrar RMs
      for (const rm of localRm) {
        const { id, isGuestRecord, ...cleanData } = rm;
        const newAthId = athleteIdMap[cleanData.userId] || cleanData.userId;
        await addDoc(refs.rmRecordsRef, {
          ...cleanData,
          userId: newAthId,
          migratedFromGuest: true,
          createdAt: serverTimestamp()
        });
        count++;
      }

      // Migrar Potencia
      for (const pwr of localPwr) {
        const { id, isGuestRecord, ...cleanData } = pwr;
        const newAthId = athleteIdMap[cleanData.userId] || cleanData.userId;
        await addDoc(refs.powerRecordsRef, {
          ...cleanData,
          userId: newAthId,
          migratedFromGuest: true,
          createdAt: serverTimestamp()
        });
        count++;
      }

      // Migrar Sesiones
      for (const ses of localSes) {
        const { id, isGuestRecord, ...cleanData } = ses;
        const newAthId = athleteIdMap[cleanData.athleteId] || cleanData.athleteId;
        await addDoc(refs.sessionsRef, {
          ...cleanData,
          athleteId: newAthId,
          migratedFromGuest: true,
          createdAt: serverTimestamp()
        });
        count++;
      }

      // Limpiar LocalStorage de invitado
      localStorage.removeItem(GUEST_STORAGE_KEYS.ATHLETES);
      localStorage.removeItem(GUEST_STORAGE_KEYS.RM);
      localStorage.removeItem(GUEST_STORAGE_KEYS.POWER);
      localStorage.removeItem(GUEST_STORAGE_KEYS.SESSIONS);
      localStorage.removeItem(GUEST_STORAGE_KEYS.GROUPS);

      showNotification(`¡${count} registros locales migrados y sincronizados con éxito a la nube!`);
      return true;
    } catch (e) {
      console.error('Error migrando datos de invitado:', e);
      showNotification('Error al migrar datos a la nube: ' + e.message, true);
      return false;
    }
  };

  // Paleta de color y tema de la aplicación
  const [appTheme, setAppTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('mp_app_theme') || 'red';
      document.documentElement.setAttribute('data-theme', saved);
      return saved;
    } catch {
      return 'red';
    }
  });

  const changeTheme = (themeId) => {
    try {
      localStorage.setItem('mp_app_theme', themeId);
    } catch (e) {}
    setAppTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    const chosen = AVAILABLE_THEMES.find(t => t.id === themeId);
    showNotification(`Paleta "${chosen?.name || themeId}" activada.`);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appTheme);
  }, [appTheme]);

  // Comprobar si hay una versión superior disponible
  const hasUpdateAvailable = isNewerVersion(appUpdateInfo?.latestVersion, CURRENT_APP_VERSION);

  // Mostrar notificaciones toast
  const showNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Gimnasio Activo (Multi-tenancy dinámico)
  const [activeGymId, setActiveGymIdState] = useState(() => getActiveGymId());
  const currentGymRefs = getGymRefs(activeGymId);

  const switchGym = (newGymId) => {
    if (!newGymId || !newGymId.trim()) return;
    const clean = newGymId.trim();
    setActiveGymId(clean);
    setActiveGymIdState(clean);
    showNotification(`Conectado al gimnasio: ${clean}`);
  };

  const resetDefaultGym = () => {
    setActiveGymId(DEFAULT_GYM_ID);
    setActiveGymIdState(DEFAULT_GYM_ID);
    showNotification('Gimnasio restablecido al principal.');
  };

  // Cargar datos en tiempo real desde Firestore (con caché offline en disco)
  useEffect(() => {
    console.log(`Conectando listeners en tiempo real a Firebase para Gym ID: ${activeGymId}...`);
    setLoading(true);

    const refs = getGymRefs(activeGymId);

    const unsubAthletes = onSnapshot(refs.athletesRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!currentUser && isGuestMode) {
        const local = getGuestStorage(GUEST_STORAGE_KEYS.ATHLETES, null);
        if (local !== null) {
          setAthletes(local);
          setLoading(false);
          return;
        }
      }
      setAthletes(list);
      setLoading(false);
    }, (err) => {
      console.warn("Aviso al cargar atletas:", err);
      setLoading(false);
    });

    const unsubGroups = onSnapshot(refs.groupsRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!currentUser && isGuestMode) {
        const local = getGuestStorage(GUEST_STORAGE_KEYS.GROUPS, null);
        if (local !== null) {
          setGroups(local);
          return;
        }
      }
      setGroups(list);
    }, (err) => console.warn("Aviso al cargar grupos:", err));

    const unsubCoaches = onSnapshot(refs.coachesRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCoaches(list);

      // Auto-inicializar Head Coach si la colección está vacía en el gimnasio principal
      if (snapshot.empty && activeGymId === DEFAULT_GYM_ID) {
        addDoc(refs.coachesRef, {
          name: 'Bayron Quezada',
          role: 'head_coach',
          title: 'Head Coach & Administrador General',
          pin: '',
          color: '#ef4444',
          assignedGroupIds: [],
          canViewAllAthletes: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }, (err) => console.warn("Aviso al cargar entrenadores:", err));

    const unsubRM = onSnapshot(refs.rmRecordsRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!currentUser && isGuestMode) {
        const local = getGuestStorage(GUEST_STORAGE_KEYS.RM, null);
        if (local !== null) {
          setRmRecords(local);
          return;
        }
      }
      setRmRecords(list);
    }, (err) => console.warn("Aviso al cargar 1RM:", err));

    const unsubPower = onSnapshot(refs.powerRecordsRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!currentUser && isGuestMode) {
        const local = getGuestStorage(GUEST_STORAGE_KEYS.POWER, null);
        if (local !== null) {
          setPowerRecords(local);
          return;
        }
      }
      setPowerRecords(list);
    }, (err) => console.warn("Aviso al cargar potencia:", err));

    const unsubSessions = onSnapshot(refs.sessionsRef, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!currentUser && isGuestMode) {
        const local = getGuestStorage(GUEST_STORAGE_KEYS.SESSIONS, null);
        if (local !== null) {
          setSessions(local);
          return;
        }
      }
      setSessions(list);
    }, (err) => console.warn("Aviso al cargar sesiones:", err));

    const unsubExercises = onSnapshot(refs.exercisesDocRef, (docSnap) => {
      if (docSnap.exists() && Object.keys(docSnap.data()).length > 0) {
        if (!currentUser && isGuestMode) {
          const local = getGuestStorage(GUEST_STORAGE_KEYS.EXERCISES, null);
          if (local !== null) {
            setExercises(local);
            return;
          }
        }
        setExercises(docSnap.data());
      }
    }, (err) => console.warn("Aviso al cargar ejercicios:", err));

    const unsubProfile = onSnapshot(refs.profileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    }, (err) => console.warn("Aviso al cargar perfil:", err));

    const unsubUpdate = onSnapshot(refs.appUpdateDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setAppUpdateInfo(docSnap.data());
      } else {
        // Inicializar documento de actualización si no existe
        setDoc(refs.appUpdateDocRef, {
          latestVersion: CURRENT_APP_VERSION,
          releaseDate: '2026-11-12',
          releaseNotes: '• Soporte multi-gimnasio y caché offline persistente.\n• Subida de fotos de atletas desde cámara y galería.\n• Compartir resumen de sesión directamente por WhatsApp.',
          downloadUrl: '',
          mandatory: false,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => console.warn('Aviso inicializando update doc:', err));
      }
    }, (err) => console.warn("Aviso al verificar actualizaciones:", err));

    return () => {
      unsubAthletes();
      unsubGroups();
      unsubCoaches();
      unsubRM();
      unsubPower();
      unsubSessions();
      unsubExercises();
      unsubProfile();
      unsubUpdate();
    };
  }, [activeGymId]);

  // Operaciones de Atletas
  const addAthlete = async (data) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para registrar datos, o activar el Modo Invitado para guardar solo en este dispositivo.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const newAthlete = {
          id: `guest_ath_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          isGuestRecord: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.ATHLETES, athletes);
        const updated = [newAthlete, ...currentList.filter(a => a.id !== newAthlete.id)];
        setGuestStorage(GUEST_STORAGE_KEYS.ATHLETES, updated);
        setAthletes(updated);
        showNotification('Atleta guardado localmente (Modo Invitado). No se actualiza para los demás.');
        return true;
      } catch (e) {
        console.error(e);
        showNotification('Error al guardar atleta local: ' + e.message, true);
        return false;
      }
    }

    try {
      await addDoc(athletesRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      showNotification('Atleta añadido con éxito en la nube.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al añadir atleta: ' + e.message, true);
      return false;
    }
  };

  const updateAthlete = async (id, data) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para editar datos, o activar el Modo Invitado.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.ATHLETES, athletes);
        const updated = currentList.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a);
        setGuestStorage(GUEST_STORAGE_KEYS.ATHLETES, updated);
        setAthletes(updated);
        showNotification('Atleta actualizado en este dispositivo.');
        return true;
      } catch (e) {
        console.error(e);
        showNotification('Error al actualizar atleta: ' + e.message, true);
        return false;
      }
    }

    try {
      const ref = doc(athletesRef, id);
      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
      });
      showNotification('Atleta actualizado.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al actualizar: ' + e.message, true);
      return false;
    }
  };

  const deleteAthlete = async (id) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para eliminar datos, o activar el Modo Invitado.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.ATHLETES, athletes);
        const updated = currentList.filter(a => a.id !== id);
        setGuestStorage(GUEST_STORAGE_KEYS.ATHLETES, updated);
        setAthletes(updated);

        // Borrar registros asociados locales
        const currentRm = getGuestStorage(GUEST_STORAGE_KEYS.RM, rmRecords).filter(r => r.userId !== id);
        setGuestStorage(GUEST_STORAGE_KEYS.RM, currentRm);
        setRmRecords(currentRm);

        const currentPwr = getGuestStorage(GUEST_STORAGE_KEYS.POWER, powerRecords).filter(r => r.userId !== id);
        setGuestStorage(GUEST_STORAGE_KEYS.POWER, currentPwr);
        setPowerRecords(currentPwr);

        showNotification('Atleta y sus registros eliminados de la memoria local.');
        return true;
      } catch (e) {
        console.error(e);
        showNotification('Error al eliminar atleta: ' + e.message, true);
        return false;
      }
    }

    try {
      const batch = writeBatch(db);
      batch.delete(doc(athletesRef, id));
      // Borrar registros asociados
      rmRecords.filter(r => r.userId === id).forEach(r => batch.delete(doc(rmRecordsRef, r.id)));
      powerRecords.filter(r => r.userId === id).forEach(r => batch.delete(doc(powerRecordsRef, r.id)));
      await batch.commit();
      showNotification('Atleta y sus registros eliminados.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al eliminar atleta: ' + e.message, true);
      return false;
    }
  };

  // Operaciones de 1RM
  const addRMRecord = async (data) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para registrar 1RM, o activar el Modo Invitado para guardar solo en este dispositivo.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const newRecord = {
          id: `guest_rm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          isGuestRecord: true,
          createdAt: new Date().toISOString()
        };
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.RM, rmRecords);
        const updated = [newRecord, ...currentList];
        setGuestStorage(GUEST_STORAGE_KEYS.RM, updated);
        setRmRecords(updated);
        showNotification('Registro 1RM guardado localmente (Modo Invitado).');
        return true;
      } catch (e) {
        console.error(e);
        showNotification('Error al guardar 1RM local: ' + e.message, true);
        return false;
      }
    }

    try {
      await addDoc(rmRecordsRef, {
        ...data,
        createdAt: serverTimestamp()
      });
      showNotification('Registro 1RM guardado en la nube.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al guardar 1RM: ' + e.message, true);
      return false;
    }
  };

  const deleteRMRecord = async (id) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para eliminar registros.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.RM, rmRecords);
        const updated = currentList.filter(r => r.id !== id);
        setGuestStorage(GUEST_STORAGE_KEYS.RM, updated);
        setRmRecords(updated);
        showNotification('Registro 1RM eliminado localmente.');
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    try {
      await deleteDoc(doc(rmRecordsRef, id));
      showNotification('Registro 1RM eliminado.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al eliminar: ' + e.message, true);
      return false;
    }
  };

  // Operaciones de Potencia
  const addPowerRecord = async (data) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para registrar potencia, o activar el Modo Invitado para guardar solo en este dispositivo.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const newRecord = {
          id: `guest_pwr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          isGuestRecord: true,
          createdAt: new Date().toISOString()
        };
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.POWER, powerRecords);
        const updated = [newRecord, ...currentList];
        setGuestStorage(GUEST_STORAGE_KEYS.POWER, updated);
        setPowerRecords(updated);
        showNotification('Registro de potencia guardado localmente (Modo Invitado).');
        return true;
      } catch (e) {
        console.error(e);
        showNotification('Error al guardar potencia local: ' + e.message, true);
        return false;
      }
    }

    try {
      await addDoc(powerRecordsRef, {
        ...data,
        createdAt: serverTimestamp()
      });
      showNotification('Registro de potencia guardado en la nube.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al guardar potencia: ' + e.message, true);
      return false;
    }
  };

  const deletePowerRecord = async (id) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para eliminar registros.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.POWER, powerRecords);
        const updated = currentList.filter(r => r.id !== id);
        setGuestStorage(GUEST_STORAGE_KEYS.POWER, updated);
        setPowerRecords(updated);
        showNotification('Registro de potencia eliminado localmente.');
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    try {
      await deleteDoc(doc(powerRecordsRef, id));
      showNotification('Registro de potencia eliminado.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al eliminar: ' + e.message, true);
      return false;
    }
  };

  // Operaciones de Sesiones
  const addSession = async (data) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para registrar sesiones, o activar el Modo Invitado para guardar solo en este dispositivo.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const newSession = {
          id: `guest_ses_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          isGuestRecord: true,
          createdAt: new Date().toISOString()
        };
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.SESSIONS, sessions);
        const updated = [newSession, ...currentList];
        setGuestStorage(GUEST_STORAGE_KEYS.SESSIONS, updated);
        setSessions(updated);
        showNotification('Sesión guardada localmente (Modo Invitado).');
        return true;
      } catch (e) {
        console.error(e);
        showNotification('Error al guardar sesión local: ' + e.message, true);
        return false;
      }
    }

    try {
      await addDoc(sessionsRef, {
        ...data,
        createdAt: serverTimestamp()
      });
      showNotification('Sesión guardada con éxito en la nube.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al guardar sesión: ' + e.message, true);
      return false;
    }
  };

  const updateSession = async (id, data) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para actualizar sesiones, o activar el Modo Invitado.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.SESSIONS, sessions);
        const updated = currentList.map(s => s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s);
        setGuestStorage(GUEST_STORAGE_KEYS.SESSIONS, updated);
        setSessions(updated);
        showNotification('Sesión actualizada localmente (Modo Invitado).');
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    try {
      await updateDoc(doc(sessionsRef, id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      showNotification('Sesión actualizada con éxito.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al actualizar sesión: ' + e.message, true);
      return false;
    }
  };

  const deleteSession = async (id) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para eliminar sesiones.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.SESSIONS, sessions);
        const updated = currentList.filter(s => s.id !== id);
        setGuestStorage(GUEST_STORAGE_KEYS.SESSIONS, updated);
        setSessions(updated);
        showNotification('Sesión eliminada de la memoria local.');
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    try {
      await deleteDoc(doc(sessionsRef, id));
      showNotification('Sesión eliminada.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al eliminar sesión: ' + e.message, true);
      return false;
    }
  };

  // ---------------- Operaciones de Biblioteca de Ejercicios (Admin/Coach) ----------------
  const addExercise = async (category, exerciseData) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión o activar el Modo Invitado para añadir ejercicios.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const current = { ...exercises };
        const cat = category.trim();
        const catList = current[cat] ? [...current[cat]] : [];
        if (catList.some(e => e.name.toLowerCase() === exerciseData.name.trim().toLowerCase())) {
          showNotification('Ya existe un ejercicio con ese nombre en esta categoría.', true);
          return false;
        }
        catList.push({
          name: exerciseData.name.trim(),
          description: exerciseData.description?.trim() || '',
          requiresVelocity: Boolean(exerciseData.requiresVelocity)
        });
        current[cat] = catList;
        setGuestStorage(GUEST_STORAGE_KEYS.EXERCISES, current);
        setExercises(current);
        showNotification(`Ejercicio "${exerciseData.name}" añadido localmente (Modo Invitado).`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    try {
      const current = { ...exercises };
      const cat = category.trim();
      const catList = current[cat] ? [...current[cat]] : [];
      if (catList.some(e => e.name.toLowerCase() === exerciseData.name.trim().toLowerCase())) {
        showNotification('Ya existe un ejercicio con ese nombre en esta categoría.', true);
        return false;
      }
      catList.push({
        name: exerciseData.name.trim(),
        description: exerciseData.description?.trim() || '',
        requiresVelocity: Boolean(exerciseData.requiresVelocity)
      });
      current[cat] = catList;
      await setDoc(exercisesDocRef, current);
      showNotification(`Ejercicio "${exerciseData.name}" añadido a "${cat}".`);
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al añadir ejercicio: ' + e.message, true);
      return false;
    }
  };

  const updateExercise = async (originalCategory, originalName, updatedData) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión o activar el Modo Invitado para editar ejercicios.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const current = { ...exercises };
        const targetCategory = (updatedData.category || originalCategory).trim();
        if (targetCategory !== originalCategory) {
          if (current[originalCategory]) {
            current[originalCategory] = current[originalCategory].filter(e => e.name !== originalName);
            if (current[originalCategory].length === 0) {
              delete current[originalCategory];
            }
          }
          const newCatList = current[targetCategory] ? [...current[targetCategory]] : [];
          newCatList.push({
            name: updatedData.name.trim(),
            description: updatedData.description?.trim() || '',
            requiresVelocity: Boolean(updatedData.requiresVelocity)
          });
          current[targetCategory] = newCatList;
        } else {
          if (current[originalCategory]) {
            current[originalCategory] = current[originalCategory].map(e => {
              if (e.name === originalName) {
                return {
                  name: updatedData.name.trim(),
                  description: updatedData.description?.trim() || '',
                  requiresVelocity: Boolean(updatedData.requiresVelocity)
                };
              }
              return e;
            });
          }
        }
        setGuestStorage(GUEST_STORAGE_KEYS.EXERCISES, current);
        setExercises(current);
        showNotification(`Ejercicio "${updatedData.name}" actualizado localmente (Modo Invitado).`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    try {
      const current = { ...exercises };
      const targetCategory = (updatedData.category || originalCategory).trim();
      
      // Si cambia de categoría
      if (targetCategory !== originalCategory) {
        if (current[originalCategory]) {
          current[originalCategory] = current[originalCategory].filter(e => e.name !== originalName);
          if (current[originalCategory].length === 0) {
            delete current[originalCategory];
          }
        }
        const newCatList = current[targetCategory] ? [...current[targetCategory]] : [];
        newCatList.push({
          name: updatedData.name.trim(),
          description: updatedData.description?.trim() || '',
          requiresVelocity: Boolean(updatedData.requiresVelocity)
        });
        current[targetCategory] = newCatList;
      } else {
        // Misma categoría
        if (current[originalCategory]) {
          current[originalCategory] = current[originalCategory].map(e => {
            if (e.name === originalName) {
              return {
                name: updatedData.name.trim(),
                description: updatedData.description?.trim() || '',
                requiresVelocity: Boolean(updatedData.requiresVelocity)
              };
            }
            return e;
          });
        }
      }

      await setDoc(exercisesDocRef, current);
      showNotification(`Ejercicio "${updatedData.name}" actualizado.`);
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al actualizar ejercicio: ' + e.message, true);
      return false;
    }
  };

  const deleteExercise = async (category, exerciseName) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión o activar el Modo Invitado.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const current = { ...exercises };
        if (current[category]) {
          current[category] = current[category].filter(e => e.name !== exerciseName);
          if (current[category].length === 0) {
            delete current[category];
          }
        }
        setGuestStorage(GUEST_STORAGE_KEYS.EXERCISES, current);
        setExercises(current);
        showNotification(`Ejercicio "${exerciseName}" eliminado localmente.`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    try {
      const current = { ...exercises };
      if (current[category]) {
        current[category] = current[category].filter(e => e.name !== exerciseName);
        if (current[category].length === 0) {
          delete current[category];
        }
      }
      await setDoc(exercisesDocRef, current);
      showNotification(`Ejercicio "${exerciseName}" eliminado.`);
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al eliminar ejercicio: ' + e.message, true);
      return false;
    }
  };

  const resetDefaultExercises = async () => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para restablecer la biblioteca.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      setGuestStorage(GUEST_STORAGE_KEYS.EXERCISES, DEFAULT_EXERCISES_DATA);
      setExercises(DEFAULT_EXERCISES_DATA);
      showNotification('Biblioteca de ejercicios restablecida localmente.');
      return true;
    }

    try {
      await setDoc(exercisesDocRef, DEFAULT_EXERCISES_DATA);
      showNotification('Biblioteca de ejercicios restablecida.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al restablecer ejercicios: ' + e.message, true);
      return false;
    }
  };

  // ---------------- Operaciones de Grupos de Trabajo ----------------
  const addGroup = async (data) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión o activar el Modo Invitado para crear grupos.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const newGroup = {
          id: `guest_grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: data.name,
          color: data.color || '#ef4444',
          description: data.description || '',
          schedule: data.schedule || '',
          athleteIds: data.athleteIds || [],
          isGuestRecord: true,
          createdAt: new Date().toISOString()
        };
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.GROUPS, groups);
        const updated = [...currentList, newGroup];
        setGuestStorage(GUEST_STORAGE_KEYS.GROUPS, updated);
        setGroups(updated);
        showNotification(`Grupo "${data.name}" creado localmente (Modo Invitado).`);
        return newGroup.id;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    try {
      const docRef = await addDoc(groupsRef, {
        name: data.name,
        color: data.color || '#ef4444',
        description: data.description || '',
        schedule: data.schedule || '',
        athleteIds: data.athleteIds || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Sincronizar groupIds en los atletas seleccionados
      if (data.athleteIds && data.athleteIds.length > 0) {
        const batch = writeBatch(db);
        data.athleteIds.forEach(athId => {
          const ath = athletes.find(a => a.id === athId);
          const current = ath?.groupIds || [];
          if (!current.includes(docRef.id)) {
            batch.update(doc(athletesRef, athId), {
              groupIds: [...current, docRef.id],
              updatedAt: serverTimestamp()
            });
          }
        });
        await batch.commit();
      }

      showNotification(`Grupo "${data.name}" creado con éxito.`);
      return docRef.id;
    } catch (e) {
      console.error(e);
      showNotification('Error al crear grupo: ' + e.message, true);
      return false;
    }
  };

  const updateGroup = async (id, data) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para actualizar grupos.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.GROUPS, groups);
        const updated = currentList.map(g => g.id === id ? { ...g, ...data } : g);
        setGuestStorage(GUEST_STORAGE_KEYS.GROUPS, updated);
        setGroups(updated);
        showNotification(`Grupo "${data.name}" actualizado localmente.`);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    try {
      const ref = doc(groupsRef, id);
      await updateDoc(ref, {
        name: data.name,
        color: data.color || '#ef4444',
        description: data.description || '',
        schedule: data.schedule || '',
        athleteIds: data.athleteIds || [],
        updatedAt: serverTimestamp()
      });

      // Sincronizar en atletas si se especifican athleteIds
      if (data.athleteIds) {
        const batch = writeBatch(db);
        athletes.forEach(ath => {
          const current = ath.groupIds || [];
          const shouldHave = data.athleteIds.includes(ath.id);
          const hasIt = current.includes(id);

          if (shouldHave && !hasIt) {
            batch.update(doc(athletesRef, ath.id), {
              groupIds: [...current, id],
              updatedAt: serverTimestamp()
            });
          } else if (!shouldHave && hasIt) {
            batch.update(doc(athletesRef, ath.id), {
              groupIds: current.filter(g => g !== id),
              updatedAt: serverTimestamp()
            });
          }
        });
        await batch.commit();
      }

      showNotification(`Grupo "${data.name}" actualizado.`);
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al actualizar grupo: ' + e.message, true);
      return false;
    }
  };

  const deleteGroup = async (id) => {
    if (!currentUser && !isGuestMode) {
      showNotification('🔒 Debes iniciar sesión para eliminar grupos.', true);
      setIsAuthModalOpen(true);
      return false;
    }

    if (!currentUser && isGuestMode) {
      try {
        const currentList = getGuestStorage(GUEST_STORAGE_KEYS.GROUPS, groups);
        const updated = currentList.filter(g => g.id !== id);
        setGuestStorage(GUEST_STORAGE_KEYS.GROUPS, updated);
        setGroups(updated);
        showNotification('Grupo de trabajo eliminado localmente.');
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }

    try {
      await deleteDoc(doc(groupsRef, id));
      // Remover ID de grupo de todos los atletas que lo tengan
      const batch = writeBatch(db);
      athletes.forEach(ath => {
        if (ath.groupIds && ath.groupIds.includes(id)) {
          batch.update(doc(athletesRef, ath.id), {
            groupIds: ath.groupIds.filter(g => g !== id),
            updatedAt: serverTimestamp()
          });
        }
      });
      await batch.commit();

      showNotification('Grupo de trabajo eliminado.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al eliminar grupo: ' + e.message, true);
      return false;
    }
  };

  // Helper para obtener los grupos asignados a un atleta
  const getAthleteGroups = (athlete) => {
    if (!athlete) return [];
    return groups.filter(g => 
      (athlete.groupIds && athlete.groupIds.includes(g.id)) || 
      (g.athleteIds && g.athleteIds.includes(athlete.id))
    );
  };

  // ---------------- Super Admin & Roles (RBAC) ----------------
  const SUPER_ADMIN_EMAILS = [
    'bayron.quezada@gmail.com',
    'unchainedfreemusic@gmail.com'
  ];

  const isSuperAdmin = Boolean(
    currentUser && 
    currentUser.email && 
    SUPER_ADMIN_EMAILS.includes(currentUser.email.toLowerCase().trim())
  );

  // Entrenador Activo y Permisos
  const currentCoach = (isSuperAdmin ? coaches.find(c => c.name?.toLowerCase().includes('bayron')) : null) ||
    coaches.find(c => c.id === currentCoachId) || 
    coaches.find(c => c.role === 'head_coach') || 
    coaches[0] || {
      id: 'default-hc',
      name: isSuperAdmin ? 'Bayron Quezada' : (profile?.displayName || 'Bayron Quezada'),
      role: 'head_coach',
      title: isSuperAdmin ? 'Super Admin & Creador' : 'Head Coach & Administrador',
      color: '#ef4444',
      assignedGroupIds: [],
      canViewAllAthletes: true
    };

  const isHeadCoach = isSuperAdmin || currentCoach?.role === 'head_coach';

  // Verifica si el entrenador activo tiene acceso para gestionar un grupo
  const hasAccessToGroup = (groupId) => {
    if (isHeadCoach) return true;
    return currentCoach?.assignedGroupIds?.includes(groupId) || false;
  };

  // Verifica si el entrenador activo tiene acceso al atleta
  const hasAccessToAthlete = (athlete) => {
    if (!athlete) return false;
    if (isHeadCoach || currentCoach?.canViewAllAthletes) return true;
    const assigned = currentCoach?.assignedGroupIds || [];
    if (assigned.length === 0) return false;

    const athleteGroupIds = athlete.groupIds || [];
    const inAthleteGroups = athleteGroupIds.some(gId => assigned.includes(gId));
    if (inAthleteGroups) return true;

    const inGroupMembers = groups
      .filter(g => assigned.includes(g.id))
      .some(g => g.athleteIds?.includes(athlete.id));
    return inGroupMembers;
  };

  // Cambiar entrenador activo
  const switchCoach = (coachId) => {
    setCurrentCoachId(coachId);
    try {
      localStorage.setItem('mp_active_coach_id', coachId);
    } catch (e) {}
    const target = coaches.find(c => c.id === coachId);
    showNotification(`Sesión cambiada a: ${target?.name || 'Entrenador'}`);
  };

  // Verificar PIN de un entrenador
  const verifyCoachPin = (coachId, enteredPin) => {
    const target = coaches.find(c => c.id === coachId);
    if (!target) return false;
    if (!target.pin || target.pin === '') return true; // sin PIN requerido
    return target.pin === enteredPin;
  };

  // Operaciones de Entrenadores
  const addCoach = async (data) => {
    try {
      const docRef = await addDoc(coachesRef, {
        name: data.name,
        role: data.role || 'coach',
        title: data.title || (data.role === 'head_coach' ? 'Head Coach' : 'Entrenador de Cuadrilla'),
        pin: data.pin || '',
        color: data.color || '#3b82f6',
        photoUrl: data.photoUrl || '',
        assignedGroupIds: data.assignedGroupIds || [],
        canViewAllAthletes: data.canViewAllAthletes ?? false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      showNotification(`Entrenador "${data.name}" añadido al equipo.`);
      return docRef.id;
    } catch (e) {
      console.error(e);
      showNotification('Error al registrar entrenador: ' + e.message, true);
      return false;
    }
  };

  const updateCoach = async (id, data) => {
    try {
      const ref = doc(coachesRef, id);
      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
      });
      showNotification(`Perfil de "${data.name || 'Entrenador'}" actualizado.`);
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al actualizar entrenador: ' + e.message, true);
      return false;
    }
  };

  const deleteCoach = async (id) => {
    try {
      const target = coaches.find(c => c.id === id);
      if (target?.name?.toLowerCase().includes('bayron') || target?.email?.toLowerCase().includes('bayron.quezada')) {
        showNotification('El Super Admin principal no puede ser eliminado.', true);
        return false;
      }
      if (target?.role === 'head_coach' && coaches.filter(c => c.role === 'head_coach').length <= 1) {
        showNotification('No puedes eliminar al único Head Coach del gimnasio.', true);
        return false;
      }
      await deleteDoc(doc(coachesRef, id));
      if (currentCoachId === id) {
        const remaining = coaches.filter(c => c.id !== id);
        const nextId = remaining[0]?.id || '';
        setCurrentCoachId(nextId);
        try { localStorage.setItem('mp_active_coach_id', nextId); } catch (e) {}
      }
      showNotification('Entrenador eliminado del equipo.');
      return true;
    } catch (e) {
      console.error(e);
      showNotification('Error al eliminar entrenador: ' + e.message, true);
      return false;
    }
  };

  // Publicar o actualizar la versión oficial en Firestore (Solo Head Coach)
  const publishAppUpdate = async ({ latestVersion, releaseNotes, downloadUrl, mandatory = false }) => {
    try {
      await setDoc(appUpdateDocRef, {
        latestVersion: latestVersion.trim(),
        releaseDate: new Date().toISOString().split('T')[0],
        releaseNotes: releaseNotes.trim(),
        downloadUrl: (downloadUrl && downloadUrl.trim()) || DEFAULT_APK_URL,
        mandatory: Boolean(mandatory),
        updatedAt: serverTimestamp()
      }, { merge: true });
      showNotification(`¡Actualización v${latestVersion} guardada y notificada a todos los dispositivos!`);
      return true;
    } catch (e) {
      console.error("Error publicando actualización:", e);
      showNotification('Error al publicar actualización: ' + e.message, true);
      return false;
    }
  };

  // Comprobar manualmente si hay actualizaciones (desde Ajustes)
  const checkForUpdatesManual = () => {
    if (hasUpdateAvailable) {
      setIsUpdateModalOpen(true);
      return true;
    } else {
      showNotification(`Tu aplicación está al día con la última versión oficial (v${CURRENT_APP_VERSION}).`);
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      currentPanel,
      setCurrentPanel,
      athletes,
      groups,
      coaches,
      currentCoach,
      isHeadCoach,
      isSuperAdmin,
      hasAccessToGroup,
      hasAccessToAthlete,
      rmRecords,
      powerRecords,
      sessions,
      exercises,
      profile,
      loading,
      notification,
      showNotification,
      addAthlete,
      updateAthlete,
      deleteAthlete,
      addGroup,
      updateGroup,
      deleteGroup,
      getAthleteGroups,
      addCoach,
      updateCoach,
      deleteCoach,
      switchCoach,
      verifyCoachPin,
      addRMRecord,
      deleteRMRecord,
      addPowerRecord,
      deletePowerRecord,
      addSession,
      updateSession,
      deleteSession,
      addExercise,
      updateExercise,
      deleteExercise,
      resetDefaultExercises,
      currentAppVersion: CURRENT_APP_VERSION,
      appUpdateInfo,
      hasUpdateAvailable,
      isUpdateModalOpen,
      setIsUpdateModalOpen,
      publishAppUpdate,
      checkForUpdatesManual,
      downloadAndInstallUpdate,
      appTheme,
      changeTheme,
      availableThemes: AVAILABLE_THEMES,
      activeGymId,
      switchGym,
      resetDefaultGym,
      currentUser,
      isAuthModalOpen,
      setIsAuthModalOpen,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      sendResetPassword,
      logout,
      isGuestMode,
      setGuestMode,
      toggleGuestMode,
      canRegister,
      migrateGuestDataToCloud
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
