/**
 * Suite Máxima Potencia - Vinculación de Ecosistema
 * Permite comunicar e iniciar Speed Tracker desde Máxima Potencia
 * pasando el contexto del levantamiento (atleta, ejercicio, peso).
 */

const SUITE_STORAGE_KEY = 'mp_suite_config';

export const DEFAULT_SUITE_CONFIG = {
  speedTracker: {
    name: 'Speed Tracker',
    packageName: 'com.speedtracker.app',
    alternativePackages: ['com.bayronquezada.speedtracker', 'com.speedtracker'],
    scheme: 'speedtracker://',
    webUrl: 'https://speedtracker.web.app',
    enabled: true
  }
};

export const getSuiteConfig = () => {
  try {
    const saved = localStorage.getItem(SUITE_STORAGE_KEY);
    if (!saved) return DEFAULT_SUITE_CONFIG;
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_SUITE_CONFIG,
      ...parsed,
      speedTracker: {
        ...DEFAULT_SUITE_CONFIG.speedTracker,
        ...(parsed.speedTracker || {})
      }
    };
  } catch (e) {
    console.error('Error al leer configuración de Suite:', e);
    return DEFAULT_SUITE_CONFIG;
  }
};

export const saveSuiteConfig = (newConfig) => {
  try {
    localStorage.setItem(SUITE_STORAGE_KEY, JSON.stringify(newConfig));
  } catch (e) {
    console.error('Error al guardar configuración de Suite:', e);
  }
};

/**
 * Comprueba si la app nativa Speed Tracker está instalada en el dispositivo Android.
 * Retorna true si está instalada, false si no, o null si estamos en navegador web.
 */
export const checkSpeedTrackerInstalled = async () => {
  const plugin = window?.Capacitor?.Plugins?.ApkInstaller;
  if (!plugin || typeof plugin.isAppInstalled !== 'function') {
    return null; // En entorno web de escritorio
  }

  const config = getSuiteConfig();
  const pkgsToTest = [
    config.speedTracker.packageName,
    ...(config.speedTracker.alternativePackages || [])
  ];

  for (const pkg of pkgsToTest) {
    try {
      const res = await plugin.isAppInstalled({ packageName: pkg });
      if (res && res.installed) {
        return { installed: true, packageName: pkg };
      }
    } catch {
      // Ignorar y seguir probando
    }
  }

  return { installed: false, packageName: config.speedTracker.packageName };
};

/**
 * Lanza Speed Tracker con los parámetros de la serie activa.
 */
export const launchSpeedTracker = async (liftContext = {}) => {
  const config = getSuiteConfig();
  const { athleteName = '', exercise = '', load = 0 } = liftContext;

  const queryParams = new URLSearchParams({
    athlete: athleteName,
    exercise: exercise,
    load: String(load || 0),
    source: 'maximapotencia',
    callback: 'maximapotencia://vbt-result'
  }).toString();

  const schemeUrl = `${config.speedTracker.scheme}vbt?${queryParams}`;

  // 1. Si estamos en Capacitor Android
  const plugin = window?.Capacitor?.Plugins?.ApkInstaller;
  if (plugin && typeof plugin.launchApp === 'function') {
    try {
      const result = await plugin.launchApp({
        packageName: config.speedTracker.packageName,
        scheme: schemeUrl,
        extras: {
          athlete: athleteName,
          exercise: exercise,
          load: String(load || 0),
          source: 'maximapotencia'
        }
      });

      if (result && result.launched) {
        return { success: true, method: 'native' };
      }

      // Si no pudo lanzar con el package principal, probar alternativas
      for (const altPkg of config.speedTracker.alternativePackages || []) {
        try {
          const altRes = await plugin.launchApp({
            packageName: altPkg,
            scheme: schemeUrl
          });
          if (altRes && altRes.launched) {
            return { success: true, method: 'native-alt' };
          }
        } catch {}
      }

      return {
        success: false,
        reason: 'NOT_INSTALLED',
        message: 'Speed Tracker no está instalado en este dispositivo.',
        webUrl: config.speedTracker.webUrl
      };
    } catch (err) {
      console.warn('Error al invocar ApkInstaller.launchApp:', err);
    }
  }

  // 2. Fallback Navegador Web / PWA
  try {
    // Intentar abrir por deep link URI
    window.location.href = schemeUrl;
    return { success: true, method: 'scheme' };
  } catch (e) {
    // Si no se puede abrir el scheme, sugerir web
    if (config.speedTracker.webUrl) {
      window.open(config.speedTracker.webUrl, '_blank');
      return { success: true, method: 'web' };
    }
    return { success: false, reason: 'SCHEME_FAILED', error: e.message };
  }
};
