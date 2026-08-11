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

    gradle = gradle.replace(
        /applicationId\s*=\s*".*?"/,
        `applicationId = "${packageName}"`
    );

    gradle = gradle.replace(
        /namespace\s*=\s*".*?"/,
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

    const oldFolder = path.join(
    javaRoot,
    "com",
    "appforge",
    "template"
);

    const parts = packageName.split(".");

    const newFolder = path.join(
        javaRoot,
        ...parts
    );

    await fs.ensureDir(path.dirname(newFolder));

    await fs.move(oldFolder, newFolder, {
        overwrite: true
    });

    await fs.remove(path.join(javaRoot, "com", "appforge"));

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