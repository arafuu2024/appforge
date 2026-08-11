const fs = require("fs-extra");
const path = require("path");

async function updateVersion(buildFolder, versionName, versionCode) {
    console.log("Updating Version...");

    const gradleFile = path.join(
        buildFolder,
        "android",
        "app",
        "build.gradle.kts"
    );

    let gradle = await fs.readFile(gradleFile, "utf8");

    // Update versionName
    gradle = gradle.replace(/versionName\s*=\s*".*?"/, `versionName = "${versionName}"`);
    // Update versionCode
    gradle = gradle.replace(/versionCode\s*=\s*\d+/, `versionCode = ${versionCode}`);

    // If the patterns didn't match (e.g., the file doesn't have those lines), we add them in the defaultConfig block
    if (gradle.includes(`versionName = "${versionName}"`) === false) {
        // We try to insert into the defaultConfig block
        gradle = gradle.replace(/(defaultConfig \{)/, `$1\n        versionName = "${versionName}"\n        versionCode = ${versionCode}`);
    }

    await fs.writeFile(gradleFile, gradle);

        console.log(`Version updated: ${versionName} (${versionCode})`);
}

module.exports = {
    updateVersion
};