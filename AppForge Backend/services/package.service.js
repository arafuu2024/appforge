const fs = require("fs-extra");
const path = require("path");

async function updatePackage(buildFolder, packageName) {

    console.log("Updating Package Name...");

    const androidFolder = path.join(buildFolder, "android");

    // ------------------------
    // Update build.gradle.kts
    // ------------------------

    const gradleFile = path.join(
        androidFolder,
        "app",
        "build.gradle.kts"
    );

    let gradle = await fs.readFile(gradleFile, "utf8");

    // Replace applicationId and namespace
    gradle = gradle.replace(
        /applicationId\s*=\s*["'].*?["']/,
        `applicationId = "${packageName}"`
    );

    gradle = gradle.replace(
        /namespace\s*=\s*["'].*?["']/,
        `namespace = "${packageName}"`
    );

    await fs.writeFile(gradleFile, gradle);

    console.log("Gradle Updated Successfully");

    // ------------------------
    // Rename Java folders
    // ------------------------

    const javaRoot = path.join(
        androidFolder,
        "app",
        "src",
        "main",
        "java"
    );

    // The source folder in the template is ALWAYS com/appforge/template
    // regardless of the target package name
    const sourceFolder = path.join(javaRoot, "com", "appforge", "template");
    
    // Verify source exists
    if (!(await fs.pathExists(sourceFolder))) {
        throw new Error(`Template source folder not found: ${sourceFolder}. Expected at android/app/src/main/java/com/appforge/template/`);
    }

    const parts = packageName.split(".");
    const newFolder = path.join(javaRoot, ...parts);

    // Create target directory
    await fs.ensureDir(path.dirname(newFolder));

    // If the target exists (e.g., rebuilding), remove it first
    if (await fs.pathExists(newFolder)) {
        await fs.remove(newFolder);
    }

    // Move template to new package folder
    await fs.move(sourceFolder, newFolder, { overwrite: true });

    // Cleanup parent directories if they're now empty
    let currentDir = path.join(javaRoot, "com", "appforge");
    while (currentDir !== javaRoot) {
        try {
            const items = await fs.readdir(currentDir);
            if (items.length === 0) {
                await fs.remove(currentDir);
                currentDir = path.dirname(currentDir);
            } else {
                break;
            }
        } catch (e) {
            break;
        }
    }

    // If package contains com.appforge, clean up empty parents
    const parentDir = path.join(javaRoot, "com");
    try {
        const parentItems = await fs.readdir(parentDir);
        if (parentItems.length === 0) {
            await fs.remove(parentDir);
        }
    } catch {}

    console.log("Folders Renamed Successfully");

    // ------------------------
    // Update package lines
    // ------------------------

    const files = await fs.readdir(newFolder);

    for (const file of files) {

        if (!file.endsWith(".kt")) continue;

        const filePath = path.join(newFolder, file);

        let text = await fs.readFile(filePath, "utf8");

        text = text.replaceAll("package com.appforge.template",`package ${packageName}`
        );

        await fs.writeFile(filePath, text);
    }

    console.log("Kotlin Packages Updated Successfully");

}

module.exports = {
    updatePackage
};