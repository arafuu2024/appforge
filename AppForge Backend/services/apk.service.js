const path = require("path");
const fs = require("fs-extra");
const { exec } = require("child_process");

async function buildAPK(buildFolder) {

    console.log("🚀 Starting APK Build...");

    const androidFolder = path.join(buildFolder, "android");

    return new Promise((resolve, reject) => {

        const gradleCommand = "gradlew.bat";
        
        exec(
        `${gradleCommand} assembleRelease`,
            {
                cwd: androidFolder,
                timeout: 1200000  // 20 minutes timeout
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