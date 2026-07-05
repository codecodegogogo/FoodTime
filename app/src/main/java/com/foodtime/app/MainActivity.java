package com.foodtime.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(false);
        settings.setAllowFileAccess(true);

        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/index.html");
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
