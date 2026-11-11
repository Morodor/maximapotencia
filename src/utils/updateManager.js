import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export const CURRENT_APP_VERSION = "2.0.1";
export const APP_BUILD_DATE = "2026-11-11";

/**
 * Compara dos versiones semánticas (ej. "2.1.0" vs "2.0.1")
 * Retorna:
 *  1 si v1 > v2
 * -1 si v1 < v2
 *  0 si son iguales
 */
export const compareVersions = (v1 = '0.0.0', v2 = '0.0.0') => {
  // Limpiar posibles prefijos 'v'
  const clean1 = (v1 || '').toString().replace(/^v/i, '').trim();
  const clean2 = (v2 || '').toString().replace(/^v/i, '').trim();

  const parts1 = clean1.split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map(p => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
};

/**
 * Verifica si la versión remota es mayor a la instalada
 */
export const isNewerVersion = (remoteVersion, currentVersion = CURRENT_APP_VERSION) => {
  if (!remoteVersion) return false;
  return compareVersions(remoteVersion, currentVersion) > 0;
};

/**
 * Abre el enlace de descarga del APK en el navegador predeterminado del sistema
 * para que Android descargue e inicie la instalación de la actualización con un toque.
 */
export const downloadAndInstallUpdate = async (downloadUrl) => {
  if (!downloadUrl) return false;

  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ 
        url: downloadUrl,
        windowName: '_system'
      });
    } else {
      window.open(downloadUrl, '_blank');
    }
    return true;
  } catch (error) {
    console.warn("Error abriendo enlace con Capacitor Browser, reintentando con window.open:", error);
    try {
      window.open(downloadUrl, '_blank');
      return true;
    } catch (e) {
      console.error("Fallo al abrir enlace de actualización:", e);
      return false;
    }
  }
};
