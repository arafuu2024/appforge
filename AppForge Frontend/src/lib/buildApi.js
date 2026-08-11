// Client for the AppForge build backend.
// Sends project config (+ optional icon file) to POST /build and returns
// the buildId + absolute downloadUrl.

const apiUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

/**
 * Trigger an APK build on the backend.
 *
 * @param {Object} projectData
 * @param {string} projectData.appName
 * @param {string} projectData.website
 * @param {string} projectData.packageName
 * @param {string} [projectData.version]      - versionName, e.g. "1.0.0"
 * @param {number} [projectData.versionCode]  - integer version code
 * @param {string} [projectData.iconUrl]      - remote icon URL (fetched and uploaded as file)
 * @param {File|Blob} [projectData.iconFile]  - local icon file (takes priority over iconUrl)
 * @param {string} [projectData.themeMode]    - "light" | "dark" | "system"
 * @param {string} [projectData.primaryColor]
 * @param {string} [projectData.accentColor]
 * @param {string[]} [projectData.permissions]
 * @param {Object} [projectData.admobConfig]
 * @param {string} [projectData.splashLogo]
 * @param {string} [projectData.splashBackground]
 * @param {string} [projectData.loadingAnimation]
 * @param {boolean} [projectData.enableFileDownload]
 * @param {boolean} [projectData.enableFileUpload]
 * @param {boolean} [projectData.enableGeolocation]
 * @param {boolean} [projectData.enableOfflineMode]
 * @param {boolean} [projectData.enablePullToRefresh]
 * @param {string} [projectData.user_email]
 *
 * @returns {Promise<{ success: boolean, buildId: string, downloadUrl: string, r2FilePath?: string }>}
 */
export async function generateApk(projectData) {
    const formData = new FormData();

    // Attach the icon. Local file wins; otherwise fetch the remote URL and attach as a file.
    const iconFile = projectData.iconFile;
    if (iconFile) {
        formData.append("icon", iconFile, iconFile.name || "icon.png");
    } else if (projectData.iconUrl) {
        try {
            const iconRes = await fetch(projectData.iconUrl);
            if (iconRes.ok) {
                const blob = await iconRes.blob();
                const ext = (blob.type.split("/")[1] || "png").split("+")[0];
                formData.append("icon", blob, `icon.${ext}`);
            } else {
                console.warn("Icon URL responded with", iconRes.status, "- building without icon");
            }
        } catch (err) {
            console.warn("Could not fetch icon URL - building without icon:", err.message);
        }
    }

    formData.append(
        "project",
        JSON.stringify({
            appName: projectData.appName,
            website: projectData.website,
            packageName: projectData.packageName,
            versionName: projectData.version || "1.0.0",
            versionCode: projectData.versionCode || 1,
            themeMode: projectData.themeMode,
            primaryColor: projectData.primaryColor,
            accentColor: projectData.accentColor,
            permissions: projectData.permissions || [],
            admobConfig: projectData.admobConfig,
            splashLogo: projectData.splashLogo,
            splashBackground: projectData.splashBackground,
            loadingAnimation: projectData.loadingAnimation,
            enableFileDownload: projectData.enableFileDownload,
            enableFileUpload: projectData.enableFileUpload,
            enableGeolocation: projectData.enableGeolocation,
            enableOfflineMode: projectData.enableOfflineMode,
            enablePullToRefresh: projectData.enablePullToRefresh,
        })
    );

    if (projectData.user_email) {
        formData.append("user_email", projectData.user_email);
    }

    let res;
    try {
        res = await fetch(`${apiUrl}/build`, {
            method: "POST",
            body: formData, // FormData sets multipart boundary automatically
        });
    } catch (err) {
        throw new Error(`Could not reach build server at ${apiUrl} — is the backend running?`);
    }

    let data;
    try {
        data = await res.json();
    } catch {
        throw new Error(`Build server returned an invalid response (HTTP ${res.status})`);
    }

    if (!res.ok || !data.success) {
        throw new Error(data.message || `Build failed (HTTP ${res.status})`);
    }

    return {
        ...data,
        // Normalize to an absolute URL so window.open() / <a href> always work
        downloadUrl: data.downloadUrl?.startsWith("http")
            ? data.downloadUrl
            : `${apiUrl}${data.downloadUrl}`,
    };
}
