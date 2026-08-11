const fs = require("fs-extra");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const { updateTemplate } = require("../services/template.service");
const { updateAppName } = require("../services/manifest.service");
const { updateVersion } = require("../services/version.service");
const { replaceAppIcons } = require("../services/icon.service");
const { updateSplashScreen } = require("../services/splash.service");
const { updatePackage } = require("../services/package.service");
const { updatePermissions } = require("../services/permissions.service");
const { updateTheme } = require("../services/theme.service");
const { setupAdMob } = require("../services/admob.service");
const { updateWebViewFeatures } = require("../services/webview.service");
const { buildAPK } = require("../services/apk.service");
const { uploadBuild } = require("../services/r2.service");

async function buildProject(req, res) {
    const buildId = uuidv4();
    const buildFolder = path.join(__dirname, "..", "builds", buildId);
    const templateFolder = path.join(__dirname, "..", "android-template");

    try {
        console.log(`🚀 Starting build ${buildId}`);

        // Ensure builds directory exists
        await fs.ensureDir(path.join(__dirname, "..", "builds"));

        // Copy android template to build folder with android subdirectory
        console.log("📁 Copying Android template...");
        await fs.ensureDir(buildFolder);
        await fs.copy(templateFolder, path.join(buildFolder, "android"));

        // Extract project data from request
        const project = JSON.parse(req.body.project);
        const iconPath = req.file ? req.file.path : null;

        console.log("📋 Project data:", {
            appName: project.appName,
            packageName: project.packageName,
            website: project.website,
            versionName: project.versionName,
            versionCode: project.versionCode,
            themeMode: project.themeMode,
            primaryColor: project.primaryColor,
            accentColor: project.accentColor,
            hasAdMob: !!project.admobConfig,
            permissions: project.permissions,
            hasIcon: !!iconPath,
            hasSplashLogo: !!project.splashLogo,
            hasSplashBackground: !!project.splashBackground,
            webviewFeatures: {
                fileDownload: project.enableFileDownload,
                fileUpload: project.enableFileUpload,
                geolocation: project.enableGeolocation,
                offlineMode: project.enableOfflineMode,
                pullToRefresh: project.enablePullToRefresh,
            }
        });

        // 1. Update package name (must be first as it renames folders)
        await updatePackage(buildFolder, project.packageName);

        // 2. Update template (website URL)
        await updateTemplate(buildFolder, project);

        // 3. Update app name
        await updateAppName(buildFolder, project);

        // 4. Update version
        await updateVersion(buildFolder, project.versionName, project.versionCode);

        // 5. Replace app icons
        if (iconPath) {
            await replaceAppIcons(buildFolder, iconPath);
        }

        // 6. Update splash screen
        if (project.splashLogo || project.splashBackground) {
            await updateSplashScreen(
                buildFolder,
                project.splashLogo,
                project.splashBackground,
                project.loadingAnimation
            );
        }

        // 7. Update permissions
        if (project.permissions && project.permissions.length > 0) {
            await updatePermissions(buildFolder, project.permissions);
        }

        // 8. Update theme
        if (project.themeMode && project.primaryColor && project.accentColor) {
            await updateTheme(
                buildFolder,
                project.themeMode,
                project.primaryColor,
                project.accentColor
            );
        }

        // 9. Setup AdMob if configured
        if (project.admobConfig && project.admobConfig.appId) {
            await setupAdMob(buildFolder, project.admobConfig, project.packageName);
        }

        // 10. Update WebView features
        await updateWebViewFeatures(buildFolder, project);

        // 11. Build the APK
        console.log("🔨 Building APK...");
        await buildAPK(buildFolder);

        // 12. Upload to R2 (Cloudflare) for persistent storage
        const outputApk = path.join(buildFolder, "output", "app.apk");
        const exists = await fs.pathExists(outputApk);
        
        if (!exists) {
            throw new Error("APK was not generated");
        }

        console.log("☁️ Uploading to Cloudflare R2...");
        let r2FilePath = null;
        try {
            r2FilePath = await uploadBuild(buildId, outputApk, "app.apk");
            console.log(`✅ Uploaded to R2: ${r2FilePath}`);
        } catch (r2Error) {
            console.error("⚠️ R2 upload failed:", r2Error.message);
            // Don't fail the build if R2 upload fails - local file is still available
        }

        console.log(`✅ Build ${buildId} completed successfully`);

        // Return build ID for download
        return res.json({
            success: true,
            buildId,
            message: "Build completed successfully",
            downloadUrl: `/download/${buildId}`,
            r2FilePath
        });

    } catch (error) {
        console.error(`❌ Build ${buildId} failed:`, error);
        
        // Cleanup on failure
        await fs.remove(buildFolder).catch(() => {});
        
        return res.status(500).json({
            success: false,
            buildId,
            message: error.message || "Build failed",
            error: error.stack
        });
    }
}

module.exports = {
    buildProject
};