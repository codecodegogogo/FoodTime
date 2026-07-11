package com.foodtime.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.Manifest;
import android.app.DatePickerDialog;
import android.content.res.Configuration;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.HapticFeedbackConstants;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 1002;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private Uri cameraPhotoUri;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setHapticFeedbackEnabled(true);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(false);
        settings.setAllowFileAccess(true);

        webView.addJavascriptInterface(new FoodTimeBridge(), "FoodTimeNative");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> filePathCallback,
                    FileChooserParams fileChooserParams) {
                if (MainActivity.this.filePathCallback != null) {
                    MainActivity.this.filePathCallback.onReceiveValue(null);
                }

                MainActivity.this.filePathCallback = filePathCallback;
                openCamera(fileChooserParams);
                return true;
            }
        });
        webView.loadUrl("file:///android_asset/index.html");
        requestNotificationPermissionIfNeeded();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.evaluateJavascript(
                    "window.FoodTimeApp&&window.FoodTimeApp.refreshTheme&&window.FoodTimeApp.refreshTheme()",
                    null);
        }
    }

    private class FoodTimeBridge {
        @JavascriptInterface
        public void pull(String settingsJson) {
            new Thread(() -> emitSyncResult(performPull(settingsJson))).start();
        }

        @JavascriptInterface
        public void push(String settingsJson, String payloadJson) {
            new Thread(() -> emitSyncResult(performPush(settingsJson, payloadJson))).start();
        }

        @JavascriptInterface
        public void updateNotificationPlan(String settingsJson, String payloadJson) {
            new Thread(() -> FoodTimeNotificationScheduler.savePlan(
                    MainActivity.this,
                    settingsJson,
                    payloadJson)).start();
        }

        @JavascriptInterface
        public String systemTheme() {
            int nightMode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
            return nightMode == Configuration.UI_MODE_NIGHT_YES ? "dark" : "light";
        }

        @JavascriptInterface
        public void showDatePicker(String currentDate) {
            runOnUiThread(() -> openDatePicker(currentDate));
        }

        @JavascriptInterface
        public void haptic(String type) {
            runOnUiThread(() -> performHapticFeedback(type));
        }

        @JavascriptInterface
        public String appVersion() {
            return BuildConfig.VERSION_NAME;
        }

        @JavascriptInterface
        public void openExternal(String url) {
            runOnUiThread(() -> openExternalUrl(url));
        }
    }

    private void openExternalUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return;
        }

        Uri uri = Uri.parse(url.trim());
        String host = uri.getHost();
        String path = uri.getPath();
        if (!"https".equalsIgnoreCase(uri.getScheme())
                || !"github.com".equalsIgnoreCase(host)
                || path == null
                || !path.startsWith("/codecodegogogo/FoodTime/releases")) {
            return;
        }

        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (Exception ignored) {
            // The update prompt remains optional if no browser is available.
        }
    }

    private void performHapticFeedback(String type) {
        if (webView == null) {
            return;
        }

        int feedback = HapticFeedbackConstants.VIRTUAL_KEY;
        if ("selection".equals(type)) {
            feedback = HapticFeedbackConstants.CLOCK_TICK;
        } else if ("confirm".equals(type) && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            feedback = HapticFeedbackConstants.CONFIRM;
        } else if ("reject".equals(type)) {
            feedback = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    ? HapticFeedbackConstants.REJECT
                    : HapticFeedbackConstants.LONG_PRESS;
        }

        webView.performHapticFeedback(feedback);
    }

    private void openDatePicker(String currentDate) {
        Calendar calendar = Calendar.getInstance();
        try {
            Date parsed = new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(currentDate);
            if (parsed != null) {
                calendar.setTime(parsed);
            }
        } catch (Exception ignored) {
        }

        DatePickerDialog dialog = new DatePickerDialog(
                this,
                (view, year, month, dayOfMonth) -> {
                    String selectedDate = String.format(
                            Locale.US,
                            "%04d-%02d-%02d",
                            year,
                            month + 1,
                            dayOfMonth);
                    emitDatePickerResult(selectedDate);
                },
                calendar.get(Calendar.YEAR),
                calendar.get(Calendar.MONTH),
                calendar.get(Calendar.DAY_OF_MONTH));
        dialog.show();
    }

    private void emitDatePickerResult(String selectedDate) {
        if (webView == null) {
            return;
        }

        runOnUiThread(() -> webView.evaluateJavascript(
                "window.FoodTimeApp&&window.FoodTimeApp.onNativePurchaseDateSelected&&window.FoodTimeApp.onNativePurchaseDateSelected("
                        + JSONObject.quote(selectedDate)
                        + ")",
                null));
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return;
        }

        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            return;
        }

        requestPermissions(
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                NOTIFICATION_PERMISSION_REQUEST);
    }

    private JSONObject performPull(String settingsJson) {
        JSONObject result = baseSyncResult("pull");
        try {
            JSONObject settings = new JSONObject(settingsJson);
            HttpURLConnection connection = openWebDavConnection(settings, "GET");
            int status = connection.getResponseCode();
            result.put("status", status);

            if (status >= 200 && status < 300) {
                result.put("ok", true);
                result.put("body", readResponse(connection.getInputStream()));
            } else if (status == HttpURLConnection.HTTP_NOT_FOUND) {
                result.put("ok", true);
                result.put("missing", true);
            } else {
                result.put("ok", false);
                result.put("message", readError(connection));
            }
            connection.disconnect();
        } catch (Exception exception) {
            putError(result, exception);
        }
        return result;
    }

    private JSONObject performPush(String settingsJson, String payloadJson) {
        JSONObject result = baseSyncResult("push");
        try {
            JSONObject settings = new JSONObject(settingsJson);
            ensureParentDirectories(settings);

            byte[] payload = payloadJson.getBytes(StandardCharsets.UTF_8);
            HttpURLConnection connection = openWebDavConnection(settings, "PUT");
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
            connection.setFixedLengthStreamingMode(payload.length);
            try (OutputStream output = connection.getOutputStream()) {
                output.write(payload);
            }

            int status = connection.getResponseCode();
            result.put("status", status);
            result.put("ok", status >= 200 && status < 300);
            if (status < 200 || status >= 300) {
                result.put("message", readError(connection));
            }
            connection.disconnect();
        } catch (Exception exception) {
            putError(result, exception);
        }
        return result;
    }

    private JSONObject baseSyncResult(String type) {
        JSONObject result = new JSONObject();
        try {
            result.put("type", type);
            result.put("ok", false);
        } catch (Exception ignored) {
        }
        return result;
    }

    private void putError(JSONObject result, Exception exception) {
        try {
            result.put("ok", false);
            result.put("message", exception.getMessage() == null ? exception.toString() : exception.getMessage());
        } catch (Exception ignored) {
        }
    }

    private void emitSyncResult(JSONObject result) {
        if (webView == null) {
            return;
        }

        runOnUiThread(() -> webView.evaluateJavascript(
                "window.FoodTimeApp&&window.FoodTimeApp.onNativeSyncResult(" + result.toString() + ")",
                null));
    }

    private HttpURLConnection openWebDavConnection(JSONObject settings, String method) throws Exception {
        URL url = new URL(buildRemoteUrl(settings));
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setConnectTimeout(15000);
        connection.setReadTimeout(20000);
        connection.setRequestMethod(method);
        connection.setRequestProperty("Accept", "application/json");
        connection.setRequestProperty("Authorization", authorizationHeader(settings));
        return connection;
    }

    private String authorizationHeader(JSONObject settings) throws Exception {
        String account = settings.optString("account", "");
        String password = settings.optString("password", "");
        String raw = account + ":" + password;
        return "Basic " + Base64.encodeToString(raw.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
    }

    private String buildRemoteUrl(JSONObject settings) throws Exception {
        String base = settings.optString("webdavUrl", "https://dav.jianguoyun.com/dav/").trim();
        String remoteFile = settings.optString("remoteFile", "/FoodTime/foodtime-data.json").trim();
        return buildRemoteUrl(base, remoteFile);
    }

    private String buildRemoteUrl(String base, String remotePath) throws Exception {
        String normalizedBase = base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
        String path = remotePath.startsWith("/") ? remotePath.substring(1) : remotePath;
        String[] parts = path.split("/");
        StringBuilder encodedPath = new StringBuilder();
        for (String part : parts) {
            if (part.isEmpty()) {
                continue;
            }
            encodedPath.append('/')
                    .append(URLEncoder.encode(part, "UTF-8").replace("+", "%20"));
        }
        return normalizedBase + encodedPath;
    }

    private void ensureParentDirectories(JSONObject settings) {
        try {
            String remoteFile = settings.optString("remoteFile", "/FoodTime/foodtime-data.json").trim();
            String base = settings.optString("webdavUrl", "https://dav.jianguoyun.com/dav/").trim();
            String path = remoteFile.startsWith("/") ? remoteFile.substring(1) : remoteFile;
            String[] parts = path.split("/");
            StringBuilder current = new StringBuilder();
            for (int index = 0; index < parts.length - 1; index++) {
                if (parts[index].isEmpty()) {
                    continue;
                }
                current.append('/').append(parts[index]);
                try {
                    HttpURLConnection connection = (HttpURLConnection) new URL(buildRemoteUrl(base, current.toString())).openConnection();
                    connection.setConnectTimeout(10000);
                    connection.setReadTimeout(10000);
                    connection.setRequestMethod("MKCOL");
                    connection.setRequestProperty("Authorization", authorizationHeader(settings));
                    connection.getResponseCode();
                    connection.disconnect();
                } catch (Exception ignored) {
                    // The folder may already exist, or the provider may reject MKCOL.
                    // PUT below will report the real sync error if the path is invalid.
                }
            }
        } catch (Exception ignored) {
        }
    }

    private String readError(HttpURLConnection connection) {
        try {
            InputStream stream = connection.getErrorStream();
            if (stream == null) {
                return "HTTP " + connection.getResponseCode();
            }
            return readResponse(stream);
        } catch (Exception exception) {
            return exception.getMessage() == null ? exception.toString() : exception.getMessage();
        }
    }

    private String readResponse(InputStream stream) throws IOException {
        byte[] buffer = new byte[4096];
        StringBuilder result = new StringBuilder();
        int read;
        try (InputStream input = stream) {
            while ((read = input.read(buffer)) != -1) {
                result.append(new String(buffer, 0, read, StandardCharsets.UTF_8));
            }
        }
        return result.toString();
    }

    private void openCamera(WebChromeClient.FileChooserParams params) {
        Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (cameraIntent.resolveActivity(getPackageManager()) != null) {
            try {
                File photoFile = createImageFile();
                cameraPhotoUri = FileProvider.getUriForFile(
                        this,
                        getPackageName() + ".fileprovider",
                        photoFile);
                cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraPhotoUri);
                cameraIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                cameraIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            } catch (IOException exception) {
                cameraIntent = null;
                cameraPhotoUri = null;
            }
        } else {
            cameraIntent = null;
        }

        if (params.isCaptureEnabled() && cameraIntent != null) {
            try {
                startActivityForResult(cameraIntent, FILE_CHOOSER_REQUEST);
                return;
            } catch (Exception ignored) {
                cameraPhotoUri = null;
            }
        }

        Intent pickerIntent = params.createIntent();
        Intent chooser = Intent.createChooser(pickerIntent, "选择食物照片");
        if (cameraIntent != null) {
            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cameraIntent});
        }

        try {
            startActivityForResult(chooser, FILE_CHOOSER_REQUEST);
        } catch (Exception exception) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(null);
                filePathCallback = null;
            }
        }
    }

    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
        File storageDir = getExternalFilesDir("FoodTimePhotos");
        if (storageDir != null && !storageDir.exists()) {
            storageDir.mkdirs();
        }
        return File.createTempFile("food_" + timeStamp + "_", ".jpg", storageDir);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode != FILE_CHOOSER_REQUEST || filePathCallback == null) {
            return;
        }

        Uri[] results = null;
        if (resultCode == Activity.RESULT_OK) {
            if (data == null || data.getData() == null) {
                if (cameraPhotoUri != null) {
                    results = new Uri[]{cameraPhotoUri};
                }
            } else {
                results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            }
        }

        filePathCallback.onReceiveValue(results);
        filePathCallback = null;
        cameraPhotoUri = null;
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript(
                    "Boolean(window.FoodTimeApp && window.FoodTimeApp.canGoBack && window.FoodTimeApp.canGoBack())",
                    canGoBack -> {
                        if ("true".equals(canGoBack)) {
                            webView.evaluateJavascript("window.FoodTimeApp.back()", null);
                        } else if (webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            finish();
                        }
                    });
            return;
        }
        super.onBackPressed();
    }
}
