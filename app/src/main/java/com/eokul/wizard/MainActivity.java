package com.eokul.wizard;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class MainActivity extends Activity {

    private static final String TAG = "EokulWizard";
    private static final int FILE_CHOOSER_REQUEST = 1001;
    private static final String EOKUL_URL = "https://e-okul.meb.gov.tr/giris.aspx";

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        setupWebView();
        webView.loadUrl(EOKUL_URL);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportZoom(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setUserAgentString(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/120.0.0.0 Safari/537.36"
        );
        WebView.setWebContentsDebuggingEnabled(true);

        webView.setWebViewClient(new EokulWebViewClient());
        webView.setWebChromeClient(new EokulWebChromeClient());
        webView.addJavascriptInterface(new WebAppInterface(), "Android");
    }

    public class WebAppInterface {
        @JavascriptInterface
        public void openWhatsApp(String number, String message) {
            try {
                String url = "https://api.whatsapp.com/send?phone=" + number + "&text=" + Uri.encode(message);
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setData(Uri.parse(url));
                i.setPackage("com.whatsapp");
                startActivity(i);
            } catch (Exception e) {
                Toast.makeText(MainActivity.this, "WhatsApp yüklü değil!", Toast.LENGTH_SHORT).show();
                String url = "https://wa.me/" + number + "?text=" + Uri.encode(message);
                Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(i);
            }
        }
    }

    private boolean isEokulPage(String url) {
        return url != null && url.contains("e-okul.meb.gov.tr");
    }

    private static final String EARLY_FAB =
        "(function(){" +
        "  if(document.getElementById('ew-fab')) return;" +
        "  function mk(){" +
        "    var f=document.createElement('div');f.id='ew-fab';" +
        "    Object.assign(f.style,{position:'fixed',bottom:'20px',right:'20px'," +
        "      width:'52px',height:'52px',zIndex:'99999999'," +
        "      background:'linear-gradient(135deg,#10b981,#059669)'," +
        "      borderRadius:'50%',display:'flex',alignItems:'center'," +
        "      justifyContent:'center',fontSize:'26px',userSelect:'none'," +
        "      cursor:'pointer'});" +
        "    f.textContent='\u26a1';document.body.appendChild(f);" +
        "  }" +
        "  if(document.body) mk();" +
        "  else document.addEventListener('DOMContentLoaded',mk);" +
        "})();";

    private class EokulWebViewClient extends WebViewClient {

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
            if (isEokulPage(url)) {
                view.evaluateJavascript(EARLY_FAB, null);
            }
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            Log.d(TAG, "onPageFinished: " + url);
            if (isEokulPage(url)) {
                injectAndroidId(view);
                injectScripts(view);
            }
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            Log.w(TAG, "SSL error bypassed: " + error);
            handler.proceed();
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return false;
        }
    }

    private class EokulWebChromeClient extends WebChromeClient {

        @Override
        public boolean onShowFileChooser(WebView webView,
                                         ValueCallback<Uri[]> callback,
                                         FileChooserParams params) {
            if (filePathCallback != null) {
                filePathCallback.onReceiveValue(null);
            }
            filePathCallback = callback;

            Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("*/*");
            intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
                "application/octet-stream"
            });
            try {
                startActivityForResult(
                    Intent.createChooser(intent, "Excel Dosyası Seç"),
                    FILE_CHOOSER_REQUEST
                );
            } catch (Exception e) {
                Log.e(TAG, "File chooser error", e);
                filePathCallback.onReceiveValue(null);
                filePathCallback = null;
                return false;
            }
            return true;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback == null) return;
            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                results = new Uri[]{ data.getData() };
            }
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }

    private void injectScripts(final WebView view) {
        final String xlsxJs  = loadAsset("xlsx.full.min.js");
        final String wizardJs = loadAsset("wizard.js");

        if (xlsxJs == null || wizardJs == null) {
            Log.e(TAG, "Asset yüklenemedi!");
            return;
        }

        view.post(() ->
            view.evaluateJavascript(
                "(typeof XLSX !== 'undefined') ? 'skip' : (function(){" + xlsxJs + "})();",
                result -> {
                    Log.d(TAG, "SheetJS: " + result);
                    view.evaluateJavascript(wizardJs, res ->
                        Log.d(TAG, "Wizard enjekte edildi")
                    );
                }
            )
        );
    }

    private String loadAsset(String filename) {
        try (InputStream is = getAssets().open(filename);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[16384];
            int len;
            while ((len = is.read(buf)) != -1) baos.write(buf, 0, len);
            return baos.toString("UTF-8");
        } catch (IOException e) {
            Log.e(TAG, "loadAsset başarısız: " + filename, e);
            return null;
        }
    }



    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    private void injectAndroidId(WebView view) {
        String androidId = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
        view.evaluateJavascript("window.ANDROID_ID = '" + androidId + "';", null);
    }
}
