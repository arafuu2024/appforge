const fs = require("fs-extra");
const path = require("path");

const PERMISSION_MAP = {
    INTERNET: "android.permission.INTERNET",
    CAMERA: "android.permission.CAMERA",
    LOCATION: "android.permission.ACCESS_FINE_LOCATION",
    STORAGE_READ: "android.permission.READ_EXTERNAL_STORAGE",
    STORAGE_WRITE: "android.permission.WRITE_EXTERNAL_STORAGE",
    MICROPHONE: "android.permission.RECORD_AUDIO",
    NOTIFICATIONS: "android.permission.POST_NOTIFICATIONS",
    VIBRATE: "android.permission.VIBRATE",
    BLUETOOTH: "android.permission.BLUETOOTH",
    BLUETOOTH_ADMIN: "android.permission.BLUETOOTH_ADMIN",
    BLUETOOTH_CONNECT: "android.permission.BLUETOOTH_CONNECT",
    BLUETOOTH_SCAN: "android.permission.BLUETOOTH_SCAN",
    GEOLOCATION: "android.permission.ACCESS_FINE_LOCATION",
    READ_CONTACTS: "android.permission.READ_CONTACTS",
    WRITE_CONTACTS: "android.permission.WRITE_CONTACTS",
    READ_PHONE_STATE: "android.permission.READ_PHONE_STATE",
    CALL_PHONE: "android.permission.CALL_PHONE",
    SEND_SMS: "android.permission.SEND_SMS",
    RECEIVE_SMS: "android.permission.RECEIVE_SMS",
    READ_SMS: "android.permission.READ_SMS",
    ACCESS_NETWORK_STATE: "android.permission.ACCESS_NETWORK_STATE",
    ACCESS_WIFI_STATE: "android.permission.ACCESS_WIFI_STATE",
    CHANGE_WIFI_STATE: "android.permission.CHANGE_WIFI_STATE",
    WAKE_LOCK: "android.permission.WAKE_LOCK",
    FOREGROUND_SERVICE: "android.permission.FOREGROUND_SERVICE",
    FOREGROUND_SERVICE_DATA_SYNC: "android.permission.FOREGROUND_SERVICE_DATA_SYNC",
};

async function updatePermissions(buildFolder, permissions) {
    console.log("Updating Permissions...");

    const manifestPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "AndroidManifest.xml"
    );

    let manifest = await fs.readFile(manifestPath, "utf8");

    // Ensure we have the manifest tag
    if (!manifest.includes("<manifest")) {
        throw new Error("Invalid AndroidManifest.xml: missing <manifest> tag");
    }

    // Extract existing permissions
    const existingPermissions = new Set();
    const permRegex = /<uses-permission\s+android:name="([^"]+)"\s*\/>/g;
    let match;
    while ((match = permRegex.exec(manifest)) !== null) {
        existingPermissions.add(match[1]);
    }

    // Always include INTERNET
    const requiredPermissions = new Set(["android.permission.INTERNET"]);

    // Map frontend permissions to Android permissions
    for (const perm of permissions) {
        if (PERMISSION_MAP[perm]) {
            requiredPermissions.add(PERMISSION_MAP[perm]);
        }
    }

    // Add storage permissions if any storage-related permission is requested
    if (permissions.includes("STORAGE") || permissions.includes("STORAGE_READ") || permissions.includes("STORAGE_WRITE")) {
        requiredPermissions.add("android.permission.READ_EXTERNAL_STORAGE");
        requiredPermissions.add("android.permission.WRITE_EXTERNAL_STORAGE");
        // For Android 13+
        requiredPermissions.add("android.permission.READ_MEDIA_IMAGES");
        requiredPermissions.add("android.permission.READ_MEDIA_VIDEO");
        requiredPermissions.add("android.permission.READ_MEDIA_AUDIO");
    }

    // Add location permissions if geolocation is requested
    if (permissions.includes("GEOLOCATION") || permissions.includes("LOCATION")) {
        requiredPermissions.add("android.permission.ACCESS_FINE_LOCATION");
        requiredPermissions.add("android.permission.ACCESS_COARSE_LOCATION");
        requiredPermissions.add("android.permission.ACCESS_BACKGROUND_LOCATION");
    }

    // Add camera permissions
    if (permissions.includes("CAMERA")) {
        requiredPermissions.add("android.permission.CAMERA");
        requiredPermissions.add("android.hardware.camera");
        requiredPermissions.add("android.hardware.camera.autofocus");
    }

    // Add microphone permissions
    if (permissions.includes("MICROPHONE")) {
        requiredPermissions.add("android.permission.RECORD_AUDIO");
        requiredPermissions.add("android.permission.MODIFY_AUDIO_SETTINGS");
    }

    // Add notification permissions (Android 13+)
    if (permissions.includes("NOTIFICATIONS")) {
        requiredPermissions.add("android.permission.POST_NOTIFICATIONS");
    }

    // Add bluetooth permissions
    if (permissions.includes("BLUETOOTH")) {
        requiredPermissions.add("android.permission.BLUETOOTH");
        requiredPermissions.add("android.permission.BLUETOOTH_ADMIN");
        // Android 12+
        requiredPermissions.add("android.permission.BLUETOOTH_CONNECT");
        requiredPermissions.add("android.permission.BLUETOOTH_SCAN");
        requiredPermissions.add("android.permission.BLUETOOTH_ADVERTISE");
    }

    // Add vibrate permission
    if (permissions.includes("VIBRATE")) {
        requiredPermissions.add("android.permission.VIBRATE");
    }

    // Build permission XML
    const permissionXml = Array.from(requiredPermissions)
        .sort()
        .map(p => `    <uses-permission android:name="${p}"/>`)
        .join("\n");

    // Replace or insert permissions in manifest
    // Find the position after <manifest> and before <application>
    const manifestTagEnd = manifest.indexOf(">", manifest.indexOf("<manifest"));
    const applicationTagStart = manifest.indexOf("<application");

    if (manifestTagEnd !== -1 && applicationTagStart !== -1) {
        // Remove existing permissions
        const beforeManifest = manifest.substring(0, manifestTagEnd + 1);
        const afterPermissions = manifest.substring(applicationTagStart);
        
        manifest = beforeManifest + "\n" + permissionXml + "\n\n" + afterPermissions;
    } else {
        throw new Error("Could not find manifest or application tags in AndroidManifest.xml");
    }

    await fs.writeFile(manifestPath, manifest);
    console.log("Permissions updated in AndroidManifest.xml");
    console.log("Added permissions:", Array.from(requiredPermissions));
}

module.exports = {
    updatePermissions
};