package com.maximapotencia.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {
    private static final String TAG = "ApkInstaller";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void startUpdate(PluginCall call) {
        String apkUrl = call.getString("url");
        if (apkUrl == null || apkUrl.trim().isEmpty()) {
            call.reject("URL no proporcionada");
            return;
        }

        Context context = getContext();
        Activity activity = getActivity();

        // En Android 8+ (Oreo y posterior), verificar permiso para instalar paquetes
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!context.getPackageManager().canRequestPackageInstalls()) {
                try {
                    Intent permissionIntent = new Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + context.getPackageName())
                    );
                    permissionIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(permissionIntent);
                    call.reject("PERMISSION_NEEDED", "Permite a Máxima Potencia instalar apps y vuelve a presionar Actualizar.");
                    return;
                } catch (Exception e) {
                    Log.w(TAG, "No se pudo abrir configuracion de fuentes desconocidas", e);
                }
            }
        }

        call.resolve(new JSObject().put("started", true));

        executor.execute(() -> {
            HttpURLConnection connection = null;
            InputStream input = null;
            FileOutputStream output = null;

            try {
                Log.d(TAG, "Iniciando descarga en background de APK desde: " + apkUrl);
                URL url = new URL(apkUrl);
                connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(30000);
                connection.setInstanceFollowRedirects(true);
                connection.connect();

                int responseCode = connection.getResponseCode();
                // Manejar posibles redirecciones HTTP 301, 302, 307, 308
                if (responseCode == HttpURLConnection.HTTP_MOVED_PERM || 
                    responseCode == HttpURLConnection.HTTP_MOVED_TEMP || 
                    responseCode == 307 || responseCode == 308) {
                    String redirectUrl = connection.getHeaderField("Location");
                    connection.disconnect();
                    url = new URL(redirectUrl);
                    connection = (HttpURLConnection) url.openConnection();
                    connection.setConnectTimeout(15000);
                    connection.setReadTimeout(30000);
                    connection.connect();
                    responseCode = connection.getResponseCode();
                }

                if (responseCode != HttpURLConnection.HTTP_OK) {
                    emitError("Error en servidor al descargar actualización (Código " + responseCode + ")");
                    return;
                }

                int fileLength = connection.getContentLength();
                input = connection.getInputStream();

                // Guardar en la carpeta privada de descargas de la app
                File outputDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (outputDir == null) {
                    outputDir = context.getCacheDir();
                }
                if (!outputDir.exists()) {
                    outputDir.mkdirs();
                }

                File outputFile = new File(outputDir, "update.apk");
                if (outputFile.exists()) {
                    outputFile.delete();
                }

                output = new FileOutputStream(outputFile);

                byte[] buffer = new byte[16384];
                long total = 0;
                int count;
                long lastEmitTime = 0;

                while ((count = input.read(buffer)) != -1) {
                    total += count;
                    output.write(buffer, 0, count);

                    long now = System.currentTimeMillis();
                    if (now - lastEmitTime > 150 || (fileLength > 0 && total >= fileLength)) {
                        lastEmitTime = now;
                        int progress = fileLength > 0 ? (int) ((total * 100) / fileLength) : -1;
                        emitProgress(progress, total, fileLength);
                    }
                }

                output.flush();
                output.close();
                output = null;

                input.close();
                input = null;

                Log.d(TAG, "Descarga completada: " + outputFile.length() + " bytes");
                emitProgress(100, total, total);

                // Disparar inmediatamente el instalador del sistema Android
                launchInstaller(context, activity, outputFile);

            } catch (Exception e) {
                Log.e(TAG, "Error durante la descarga nativa del APK", e);
                emitError("Error al descargar la actualización: " + e.getMessage());
            } finally {
                try { if (output != null) output.close(); } catch (Exception ignored) {}
                try { if (input != null) input.close(); } catch (Exception ignored) {}
                if (connection != null) connection.disconnect();
            }
        });
    }

    private void launchInstaller(Context context, Activity activity, File apkFile) {
        activity.runOnUiThread(() -> {
            try {
                Uri contentUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    apkFile
                );

                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(contentUri, "application/vnd.android.package-archive");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                JSObject res = new JSObject();
                res.put("status", "installing");
                notifyListeners("updateStatus", res);

                activity.startActivity(intent);
            } catch (Exception e) {
                Log.e(TAG, "Error al lanzar Intent de instalación", e);
                emitError("No se pudo iniciar el instalador de Android: " + e.getMessage());
            }
        });
    }

    private void emitProgress(int percent, long currentBytes, long totalBytes) {
        JSObject progressObj = new JSObject();
        progressObj.put("percent", percent);
        progressObj.put("currentBytes", currentBytes);
        progressObj.put("totalBytes", totalBytes);
        notifyListeners("downloadProgress", progressObj);
    }

    private void emitError(String message) {
        JSObject err = new JSObject();
        err.put("error", message);
        notifyListeners("updateError", err);
    }

    @PluginMethod
    public void isAppInstalled(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null || packageName.trim().isEmpty()) {
            call.reject("packageName requerido");
            return;
        }

        try {
            getContext().getPackageManager().getPackageInfo(packageName, 0);
            JSObject ret = new JSObject();
            ret.put("installed", true);
            ret.put("packageName", packageName);
            call.resolve(ret);
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("installed", false);
            ret.put("packageName", packageName);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void launchApp(PluginCall call) {
        String packageName = call.getString("packageName");
        String scheme = call.getString("scheme");
        JSObject extras = call.getObject("extras");

        Context context = getContext();
        Activity activity = getActivity();

        try {
            Intent intent = null;

            // 1. Prioridad: Buscar Intent de lanzamiento directo por paquete si se especificó
            if (packageName != null && !packageName.trim().isEmpty()) {
                intent = context.getPackageManager().getLaunchIntentForPackage(packageName);
            }

            // 2. Si no se encontró launcher o viene scheme, verificar si el scheme resuelve
            if (intent == null && scheme != null && !scheme.trim().isEmpty()) {
                Intent schemeIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(scheme));
                schemeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (schemeIntent.resolveActivity(context.getPackageManager()) != null) {
                    intent = schemeIntent;
                }
            }

            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                // Adjuntar extras opcionales si vienen
                if (extras != null) {
                    for (java.util.Iterator<String> it = extras.keys(); it.hasNext(); ) {
                        String key = it.next();
                        intent.putExtra(key, extras.getString(key));
                    }
                }

                activity.startActivity(intent);

                JSObject ret = new JSObject();
                ret.put("launched", true);
                ret.put("packageName", packageName);
                call.resolve(ret);
            } else {
                JSObject ret = new JSObject();
                ret.put("launched", false);
                ret.put("installed", false);
                ret.put("error", "APP_NOT_INSTALLED");
                call.resolve(ret);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error al lanzar app externa", e);
            JSObject ret = new JSObject();
            ret.put("launched", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }
}
