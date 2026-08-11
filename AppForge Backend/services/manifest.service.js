const fs = require("fs-extra");
const path = require("path");

async function updateAppName(buildFolder, project) {

    console.log("Updating App Name...");

    const stringsPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "res",
        "values",
        "strings.xml"
    );

    let strings = await fs.readFile(stringsPath, "utf8");

    strings = strings.replace(
        /<string name="app_name">.*?<\/string>/,
        `<string name="app_name">${project.appName}</string>`
    );

    await fs.writeFile(stringsPath, strings);

    console.log("App Name Updated Successfully");

}

module.exports = {
    updateAppName
};