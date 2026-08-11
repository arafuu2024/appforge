const path = require("path");
const fs = require("fs-extra");
const { exec } = require("child_process");

async function buildAPK(buildFolder) {

    console.log("🚀 Starting APK Build...");

    const androidFolder = path.join(buildFolder, "android");

    return new Promise((resolve, reject) => {

        // Cross-platform: gradlew.bat on Windows, ./gradlew on Linux/macOS
        const isWindows = process.platform === "win32";
        const gradleCommand = isWindows ? "gradlew.bat" : "./gradlew";

        // Ensure the wrapper is executable on POSIX systems
        if (!isWindows) {
            try { fs.chmodSync(path.join(androidFolder, "gradlew"), 0o755); } catch {}
        }

        exec(
        `${gradleCommand} assembleRelease --no-daemon`,
            {
                cwd: androidFolder,
                timeout: 1200000,  // 20 minutes timeout
                maxBuffer: 16 * 1024 * 1024, // Gradle logs can be large
                env: { ...process.env, CI: "true" }
            },
            async (error, stdout, stderr) => {

                console.log(stdout);

                if (error) {
                    console.error("❌ Gradle Build Error:");
                    console.error(stderr);
                    return reject(error);
                }

                const generatedAPK = path.join(
                androidFolder,
                "app",
                "build",
                "outputs",
                "apk",
                "release",
                "app-release-unsigned.apk"
                );

                const outputFolder = path.join(
                    buildFolder,
                    "output"
                );

                await fs.ensureDir(outputFolder);

                const finalAPK = path.join(
                    outputFolder,
                    "app.apk"
                );

                await fs.copy(generatedAPK, finalAPK);

                console.log("✅ APK Built Successfully");
                console.log("📱 APK Location:", finalAPK);

                resolve(finalAPK);

            }
        );

    });

}

module.exports = {
    buildAPK
};