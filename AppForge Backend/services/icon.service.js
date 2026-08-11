const path = require("path");
const sharp = require("sharp");
const fs = require("fs-extra");

async function replaceAppIcons(buildFolder, iconPath) {

    console.log("🎨 Replacing App Icons...");

    const resFolder = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "res"
    );

    const iconSizes = [
        { folder: "mipmap-mdpi", size: 48 },
        { folder: "mipmap-hdpi", size: 72 },
        { folder: "mipmap-xhdpi", size: 96 },
        { folder: "mipmap-xxhdpi", size: 144 },
        { folder: "mipmap-xxxhdpi", size: 192 }
    ];

    for (const icon of iconSizes) {

    const launcher = path.join(
        resFolder,
        icon.folder,
        "ic_launcher.png"
    );

    const launcherRound = path.join(
        resFolder,
        icon.folder,
        "ic_launcher_round.png"
    );

    // Delete old webp icons
    await fs.remove(
        path.join(resFolder, icon.folder, "ic_launcher.webp")
    );

    await fs.remove(
        path.join(resFolder, icon.folder, "ic_launcher_round.webp")
    );

    await sharp(iconPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(launcher);

    await sharp(iconPath)
        .resize(icon.size, icon.size)
        .png()
        .toFile(launcherRound);

    console.log(`✅ ${icon.folder} updated`);
}

    console.log("🎉 All launcher icons replaced.");

}

module.exports = {
    replaceAppIcons
};