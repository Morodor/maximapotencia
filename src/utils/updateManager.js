import { Browser } from '@capacitor/browser';
import { Capacitor, registerPlugin } from '@capacitor/core';

export const CURRENT_APP_VERSION = "2.3.0";
export const APP_BUILD_DATE = "2026-11-13";
export const DEFAULT_APK_URL = "https://github.com/Morodor/maximapotencia/releases/latest/download/Maxima_Potencia.apk";

export const ApkInstaller = registerPlugin('ApkInstaller');

/**
 * Compara dos versiones semánticas (ej. "2.1.0" vs "2.0.1")
 * Retorna:
 *  1 si v1 > v2
 * -1 si v1 < v2
 *  0 si son iguales
 */
export const compareVersions = (v1 = '0.0.0', v2 = '0.0.0') => {
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
 * Inicia la actualización nativa con 1 solo clic:
 * Descarga el archivo APK directamente en background dentro de la app
 * y lanza automáticamente el instalador de Android sin pasar por Chrome.
 */
export const startNativeUpdate = async (downloadUrl, onProgress, onError) => {
  const url = downloadUrl || DEFAULT_APK_URL;
  if (!url) return false;

  if (Capacitor.isNativePlatform()) {
    try {
      if (onProgress) {
        await ApkInstaller.addListener('downloadProgress', (data) => {
          onProgress(data);
        });
      }

      if (onError) {
        await ApkInstaller.addListener('updateError', (err) => {
          onError(err.error || 'Error durante la actualización');
        });
      }

      await ApkInstaller.startUpdate({ url });
      return true;
    } catch (e) {
      console.warn("Fallo en actualizador nativo, recurriendo al navegador del sistema:", e);
      if (onError) onError(e.message || 'Error iniciando actualizador');
      return downloadAndInstallUpdate(url);
    }
  } else {
    // Si está en navegador de PC
    window.open(url, '_blank');
    return true;
  }
};

/**
 * Abre el enlace de descarga del APK en el navegador (fallback)
 */
export const downloadAndInstallUpdate = async (downloadUrl) => {
  const url = downloadUrl || DEFAULT_APK_URL;
  if (!url) return false;

  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ 
        url,
        windowName: '_system'
      });
    } else {
      window.open(url, '_blank');
    }
    return true;
  } catch (error) {
    console.warn("Error abriendo enlace con Capacitor Browser, reintentando con window.open:", error);
    try {
      window.open(url, '_blank');
      return true;
    } catch (e) {
      console.error("Fallo al abrir enlace de actualización:", e);
      return false;
    }
  }
};
