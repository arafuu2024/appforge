const fs = require("fs-extra");
const path = require("path");

async function updateTemplate(buildFolder, project) {

    console.log("Updating Android Template...");

    const configPath = path.join(
    buildFolder,
    "android",
    "app",
    "src",
    "main",
    "java",
    "com",
    "appforge",
    "template",
    "Config.kt"
);
    console.log("Config Path:");
    console.log(configPath);

    const exists = await fs.pathExists(configPath);
    console.log("Config Exists:", exists);

    let config = await fs.readFile(configPath, "utf8");

    config = config.replace(
        /const val WEBSITE_URL = ".*?"/,
        `const val WEBSITE_URL = "${project.website}"`
    );

    await fs.writeFile(configPath, config);

    console.log("Config.kt Updated Successfully");

}

module.exports = {
    updateTemplate
};