const fs = require("fs-extra");
const path = require("path");

async function setupAdMob(buildFolder, admobConfig, packageName) {
    console.log("Setting up AdMob...");

    const androidFolder = path.join(buildFolder, "android");
    const appFolder = path.join(androidFolder, "app");

    // 1. Add Google Mobile Ads SDK dependency to app-level build.gradle.kts
    const appGradlePath = path.join(appFolder, "build.gradle.kts");
    let appGradle = await fs.readFile(appGradlePath, "utf8");

    // Add the implementation for Google Mobile Ads SDK
    const admobDep = 'implementation(\"com.google.android.gms:play-services-ads:23.0.0\")';
    if (!appGradle.includes(admobDep)) {
        if (appGradle.includes("dependencies {")) {
            appGradle = appGradle.replace(/(dependencies \\{)/, `$1\n    ${admobDep}`);
} else {
            appGradle = appGradle.replace(/(\\})$/, `\ndependencies {\n    ${admobDep}\n}\n$1`);
        }
        await fs.writeFile(appGradlePath, appGradle);
    }

    // 2. Update AndroidManifest.xml to include AdMob App ID and required permissions
    const manifestPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "AndroidManifest.xml"
    );

    let manifest = await fs.readFile(manifestPath, "utf8");

    // Add the AdMob App ID as a meta-data tag under the application tag
    // We assume admobConfig contains { appId: "ca-app-pub-..." }
    if (admobConfig && admobConfig.appId) {
        const metaDataTag = `    <meta-data
        android:name=\"com.google.android.gms.ads.APPLICATION_ID\"
        android:value=\"${admobConfig.appId}\"/>`;
        
        // Insert the meta-data tag inside the application tag, before the closing </application>
        manifest = manifest.replace(/(<application[^>]*>)/, `$1\n${metaDataTag}`);
    }

    // Add the AdActivity if not present (required for ads)
    // We'll check if the AdActivity is already declared, if not, add it.
    const adActivityTag = `<activity
        android:name=\"com.google.android.gms.ads.AdActivity\"
        android:exported=\"true\"
        android:theme=\"@android:style/Theme.Translucent\" />`;
    if (!manifest.includes("com.google.android.gms.ads.AdActivity")) {
        // Insert before the closing </application> tag
        manifest = manifest.replace(/(<\/application>)/, `${adActivityTag}\n$1`);
    }

    // Add the INTERNET permission if not already present (it should be, but just in case)
    if (!manifest.includes("android.permission.INTERNET")) {
        manifest = manifest.replace(/(<manifest[^>]*>)/, `$1\n    <uses-permission android:name=\"android.permission.INTERNET\" />`);
    }

    await fs.writeFile(manifestPath, manifest);

    // 3. Optionally, we could update MainActivity to initialize MobileAds, but the Ads SDK can be initialized in the Application class.
    // For simplicity, we'll initialize in MainActivity's onCreate.
    // We'll update MainActivity.kt to include the MobileAds initialization.
    const mainActivityPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "java",
        packageName.replace(/\./g, "/"),
        "MainActivity.kt"
    );

    let mainActivity = await fs.readFile(mainActivityPath, "utf8");

    // Add the import for MobileAds
    if (!mainActivity.includes("import com.google.android.gms.ads.MobileAds")) {
        const packageEnd = mainActivity.indexOf("\n\n", mainActivity.indexOf("package "));
        if (packageEnd !== -1) {
            const beforePackage = mainActivity.substring(0, packageEnd + 2);
            const afterPackage = mainActivity.substring(packageEnd + 2);
            mainActivity = beforePackage + "import com.google.android.gms.ads.MobileAds\n" + afterPackage;
        }
    }

    // Add the MobileAds initialization in the onCreate method, after setting the content view.
    // We'll look for the line: setContentView(webView)
    // We'll insert after that line.
    const initLine = `        MobileAds.initialize(this) {}
        // Initialize interstitial ads if needed
        // You can load ads here or in a separate method
        if (admobConfig && admobConfig.interstitialAdUnitId) {
            // Example: load an interstitial ad
            // This is just a placeholder; you would need to implement ad loading and showing
        }`;
    
    // We'll insert the initLine after the setContentView line.
    const setContentViewIndex = mainActivity.indexOf("setContentView(webView)");
    if (setContentViewIndex !== -1) {
        const afterSetContentView = mainActivity.indexOf("\n", setContentViewIndex) + 1;
        const beforeInit = mainActivity.substring(0, afterSetContentView);
        const afterInit = mainActivity.substring(afterSetContentView);
        mainActivity = beforeInit + initLine + "\n" + afterInit;
    }

    await fs.writeFile(mainActivityPath, mainActivity);

    console.log("AdMob setup completed");
}

module.exports = {
    setupAdMob
};