const fs = require("fs-extra");
const path = require("path");

async function copyAndroidTemplate(buildFolder) {

    const templatePath = path.join(__dirname, "..", "android-template");

    const destination = path.join(buildFolder, "android");

    console.log("📁 Copying Android Template...");
    console.log("From:", templatePath);
    console.log("To:", destination);

    await fs.copy(templatePath, destination);

    console.log("✅ Android Template Copied");

    return destination;

}

module.exports = {
    copyAndroidTemplate
};