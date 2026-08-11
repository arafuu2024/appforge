const fs = require("fs-extra");
const path = require("path");
const { glob } = require("glob");

async function updateTemplate(buildFolder, project) {

    console.log("Updating Android Template...");

    const javaRoot = path.join(
        buildFolder, "android", "app", "src", "main", "java"
    );

    // Find Config.kt dynamically, regardless of package folder name
    let configPath = null;
    const candidates = await glob("**/Config.kt", { cwd: javaRoot });
    if (!candidates || candidates.length === 0) {
        throw new Error(`Config.kt not found under ${javaRoot}. Template folder name may differ.`);
    }
    configPath = path.join(javaRoot, candidates[0]);
    
    console.log(`Config.kt Found: ${candidates[0]} (full path: ${configPath})`);

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