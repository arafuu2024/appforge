const fs = require("fs-extra");
const path = require("path");

async function updateWebViewFeatures(buildFolder, project) {
    console.log("Updating WebView Features...");

    // Find MainActivity.kt at the correct package location
    const packageName = project.packageName || "com.appforge.template";
    const packagePath = packageName.replace(/\./g, path.sep);
    const mainActivityPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "java",
        packagePath,
        "MainActivity.kt"
    );

    let mainActivity = await fs.readFile(mainActivityPath, "utf8");

    // Build WebView configuration
    const webViewConfig = [];

    // Basic settings (always enabled)
    webViewConfig.push("        webView.settings.javaScriptEnabled = true");
    webViewConfig.push("        webView.settings.domStorageEnabled = true");
    webViewConfig.push("        webView.settings.allowFileAccess = true");
    webViewConfig.push("        webView.settings.allowContentAccess = true");
    webViewConfig.push("        webView.settings.loadsImagesAutomatically = true");
    webViewConfig.push("        webView.settings.useWideViewPort = true");
    webViewConfig.push("        webView.settings.loadWithOverviewMode = true");
    webViewConfig.push("        webView.settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW");
    webViewConfig.push("        webView.settings.javaScriptCanOpenWindowsAutomatically = true");
    webViewConfig.push("        webView.settings.setSupportMultipleWindows(true)");

    // File download
    if (project.enableFileDownload) {
        webViewConfig.push("        // File Download Support");
        webViewConfig.push("        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->");
        webViewConfig.push("            val request = DownloadManager.Request(Uri.parse(url))");
        webViewConfig.push("            request.setMimeType(mimeType)");
        webViewConfig.push("            request.addRequestHeader(\"User-Agent\", userAgent)");
        webViewConfig.push("            request.setDescription(\"Downloading file...\")");
        webViewConfig.push("            request.setTitle(URLUtil.guessFileName(url, contentDisposition, mimeType))");
        webViewConfig.push("            request.allowScanningByMediaScanner()");
        webViewConfig.push("            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)");
        webViewConfig.push("            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, contentDisposition, mimeType))");
        webViewConfig.push("            val dm = getSystemService(DOWNLOAD_SERVICE) as DownloadManager");
        webViewConfig.push("            dm.enqueue(request)");
        webViewConfig.push("            Toast.makeText(this@MainActivity, \"Download started\", Toast.LENGTH_SHORT).show()");
        webViewConfig.push("        }");
    }

    // File upload
    if (project.enableFileUpload) {
        webViewConfig.push("        // File Upload Support");
        webViewConfig.push("        var uploadMessage: ValueCallback<Array<Uri>>? = null");
        webViewConfig.push("        var uploadMessageSingle: ValueCallback<Uri>? = null");
        webViewConfig.push("        webView.webChromeClient = object : WebChromeClient() {");
        webViewConfig.push("            override fun onShowFileChooser(");
        webViewConfig.push("                webView: WebView,");
        webViewConfig.push("                filePathCallback: ValueCallback<Array<Uri>>,");
        webViewConfig.push("                fileChooserParams: FileChooserParams");
        webViewConfig.push("            ): Boolean {");
        webViewConfig.push("                uploadMessage = filePathCallback");
        webViewConfig.push("                val intent = Intent(Intent.ACTION_GET_CONTENT)");
        webViewConfig.push("                intent.addCategory(Intent.CATEGORY_OPENABLE)");
        webViewConfig.push("                intent.type = \"*/*\"");
        webViewConfig.push("                if (fileChooserParams.mode == FileChooserParams.MODE_OPEN_MULTIPLE) {");
        webViewConfig.push("                    intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)");
        webViewConfig.push("                }");
        webViewConfig.push("                startActivityForResult(Intent.createChooser(intent, \"Select File\"), FILE_CHOOSER_REQUEST_CODE)");
        webViewConfig.push("                return true");
        webViewConfig.push("            }");
        webViewConfig.push("        }");
    }

    // Geolocation
    if (project.enableGeolocation) {
        webViewConfig.push("        // Geolocation Support");
        webViewConfig.push("        webView.settings.geolocationEnabled = true");
        webViewConfig.push("        webView.settings.setGeolocationDatabasePath(this.filesDir.path)");
        webViewConfig.push("        webView.webChromeClient = object : WebChromeClient() {");
        webViewConfig.push("            override fun onGeolocationPermissionsShowPrompt(origin: String, callback: GeolocationPermissions.Callback) {");
        webViewConfig.push("                callback.invoke(origin, true, false)");
        webViewConfig.push("            }");
        webViewConfig.push("        }");
    }

    // Offline mode
    if (project.enableOfflineMode) {
        webViewConfig.push("        // Offline Mode / Caching");
        webViewConfig.push("        webView.settings.cacheMode = WebSettings.LOAD_DEFAULT");
        webViewConfig.push("        webView.settings.appCacheEnabled = true");
        webViewConfig.push("        webView.settings.appCachePath = this.cacheDir.absolutePath");
        webViewConfig.push("        webView.settings.databaseEnabled = true");
        webViewConfig.push("        webView.settings.appCacheMaxSize = 50 * 1024 * 1024 // 50MB");
    }

    // Add required imports
    const imports = [];
    if (project.enableFileDownload) {
        imports.push("import android.app.DownloadManager");
        imports.push("import android.net.Uri");
        imports.push("import android.os.Environment");
        imports.push("import android.webkit.URLUtil");
        imports.push("import android.widget.Toast");
    }
    if (project.enableFileUpload) {
        imports.push("import android.app.Activity");
        imports.push("import android.content.Intent");
        imports.push("import android.net.Uri");
        imports.push("import android.webkit.ValueCallback");
        imports.push("import android.webkit.WebChromeClient");
        imports.push("import android.webkit.FileChooserParams");
        imports.push("import android.webkit.WebView");
    }
    if (project.enableGeolocation) {
        imports.push("import android.webkit.GeolocationPermissions");
        imports.push("import android.webkit.WebChromeClient");
    }
    if (project.enableOfflineMode) {
        imports.push("import android.webkit.WebSettings");
    }
    if (project.enableFileUpload || project.enableGeolocation) {
        imports.push("import android.webkit.WebView");
        imports.push("import android.webkit.WebChromeClient");
        imports.push("import android.webkit.ValueCallback");
    }
    // Always need WebSettings for mixedContentMode
    imports.push("import android.webkit.WebSettings");
    if (project.enableFileUpload) {
        imports.push("import android.webkit.WebView");
    }

    // Add imports after package declaration
    if (imports.length > 0) {
        const packageEnd = mainActivity.indexOf("\n\n", mainActivity.indexOf("package "));
        if (packageEnd !== -1) {
            const beforePackage = mainActivity.substring(0, packageEnd + 2);
            const afterPackage = mainActivity.substring(packageEnd + 2);
            const uniqueImports = [...new Set(imports)].join("\n");
            mainActivity = beforePackage + uniqueImports + "\n\n" + afterPackage;
        }
    }

    // Replace the WebView configuration section
    const settingsStart = mainActivity.indexOf("webView.settings.javaScriptEnabled");
    const onBackPressedStart = mainActivity.indexOf("override fun onBackPressed");

    if (settingsStart !== -1 && onBackPressedStart !== -1) {
        const beforeSettings = mainActivity.substring(0, settingsStart);
        const afterSettings = mainActivity.substring(onBackPressedStart);

        const newConfig = webViewConfig.join("\n") + "\n\n";

        mainActivity = beforeSettings + newConfig + afterSettings;
        await fs.writeFile(mainActivityPath, mainActivity);
        console.log("WebView features updated in MainActivity.kt");
    } else {
        console.warn("Could not find WebView settings block in MainActivity.kt");
    }

    // If pull to refresh is enabled, we need to update the layout
    if (project.enablePullToRefresh) {
        await updateLayoutForPullToRefresh(buildFolder, packageName);
    }
}

async function updateLayoutForPullToRefresh(buildFolder, packageName) {
    console.log("Updating Layout for Pull to Refresh...");

    const layoutPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "res",
        "layout",
        "activity_main.xml"
    );

    let layout = await fs.readFile(layoutPath, "utf8");

    // Check if already has SwipeRefreshLayout
    if (layout.includes("SwipeRefreshLayout")) {
        console.log("Layout already has SwipeRefreshLayout");
        return;
    }

    // Wrap WebView in SwipeRefreshLayout
    layout = layout.replace(
        /<WebView([^>]*)\/>/,
        (match, attrs) => {
            return `<androidx.swiperefreshlayout.widget.SwipeRefreshLayout
        xmlns:android="http://schemas.android.com/apk/res/android"
        xmlns:app="http://schemas.android.com/apk/res-auto"
        android:id="@+id/swipeRefreshLayout"
        android:layout_width="match_parent"
        android:layout_height="match_parent">
    <WebView${attrs} />
</androidx.swiperefreshlayout.widget.SwipeRefreshLayout>`;
        }
    );

    // Also handle case where WebView has closing tag
    layout = layout.replace(
        /<WebView([^>]*)>([\s\S]*?)<\/WebView>/,
        (match, attrs, content) => {
            return `<androidx.swiperefreshlayout.widget.SwipeRefreshLayout
        xmlns:android="http://schemas.android.com/apk/res/android"
        xmlns:app="http://schemas.android.com/apk/res-auto"
        android:id="@+id/swipeRefreshLayout"
        android:layout_width="match_parent"
        android:layout_height="match_parent">
    <WebView${attrs}>${content}</WebView>
</androidx.swiperefreshlayout.widget.SwipeRefreshLayout>`;
        }
    );

    await fs.writeFile(layoutPath, layout);

    // Now update MainActivity to handle SwipeRefreshLayout
    const packagePath = packageName.replace(/\./g, path.sep);
    const mainActivityPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "java",
        packagePath,
        "MainActivity.kt"
    );

    let mainActivity = await fs.readFile(mainActivityPath, "utf8");

    // Add SwipeRefreshLayout import
    if (!mainActivity.includes("SwipeRefreshLayout")) {
        const packageEnd = mainActivity.indexOf("\n\n", mainActivity.indexOf("package "));
        if (packageEnd !== -1) {
            const beforePackage = mainActivity.substring(0, packageEnd + 2);
            const afterPackage = mainActivity.substring(packageEnd + 2);
            mainActivity = beforePackage + "import androidx.swiperefreshlayout.widget.SwipeRefreshLayout\n" + afterPackage;
        }
    }

    // Add SwipeRefreshLayout initialization and listener
    const onCreateEnd = mainActivity.indexOf("webView.loadUrl(Config.WEBSITE_URL)");
    if (onCreateEnd !== -1) {
        const loadUrlEnd = mainActivity.indexOf("\n", onCreateEnd) + 1;
        const beforeLoad = mainActivity.substring(0, loadUrlEnd);
        const afterLoad = mainActivity.substring(loadUrlEnd);

        const swipeRefreshCode = `
        val swipeRefreshLayout = findViewById<SwipeRefreshLayout>(R.id.swipeRefreshLayout)
        swipeRefreshLayout.setOnRefreshListener {
            webView.reload()
            swipeRefreshLayout.isRefreshing = false
        }
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                swipeRefreshLayout.isRefreshing = false
            }
        }
`;

        mainActivity = beforeLoad + swipeRefreshCode + afterLoad;
        await fs.writeFile(mainActivityPath, mainActivity);
        console.log("Pull to refresh support added to MainActivity.kt");
    }
}

module.exports = {
    updateWebViewFeatures
};
