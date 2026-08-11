const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");
const axios = require("axios");

async function updateSplashScreen(buildFolder, splashLogo, splashBackground, loadingAnimation) {
    console.log("Updating Splash Screen...");

    const resFolder = path.join(buildFolder, "android", "app", "src", "main", "res");

    // Create drawable folder if it doesn't exist
    const drawableFolder = path.join(resFolder, "drawable");
    await fs.ensureDir(drawableFolder);

    // We'll create a splash screen background and logo
    // For simplicity, we'll use a layer-list drawable that combines the background and logo
    // But note: Android 12+ has a new splash screen API, but we'll support older versions with a splash theme.

    // We'll create a splash theme and set it as the window background for the launch window.

    // 1. Process the splash logo if provided
    let logoPath = null;
    if (splashLogo) {
        try {
            const response = await axios.get(splashLogo, { responseType: "arraybuffer" });
            logoPath = path.join(drawableFolder, "splash_logo.png");
            await sharp(response.data)
                .resize(200, 200) // Reasonable size for splash logo
                .png()
                .toFile(logoPath);
            console.log("Splash logo processed and saved.");
        } catch (error) {
            console.error("Error processing splash logo:", error);
            // Continue without logo
        }
    }

    // 2. Process the splash background if provided
    let backgroundPath = null;
    if (splashBackground) {
        try {
            const response = await axios.get(splashBackground, { responseType: "arraybuffer" });
            backgroundPath = path.join(drawableFolder, "splash_background.png");
            await sharp(response.data)
                .resize(1080, 1920) // Common splash background size
                .png()
                .toFile(backgroundPath);
            console.log("Splash background processed and saved.");
        } catch (error) {
            console.error("Error processing splash background:", error);
            // Continue without background
        }
    }

    // 3. Create the splash screen theme
    // We'll create a new theme for the splash window and set it as the theme for the MainActivity in the manifest.
    // But note: we are already setting the theme in the theme.service. We'll adjust the theme.service to use the splash theme.
    // However, to keep things modular, we'll create the splash theme here and then the theme service can use it.
    // Alternatively, we can have the theme service handle the splash screen as part of the theme.
    // Given the complexity, let's do:
    //   - The theme service sets the overall app theme (including colors).
    //   - The splash service creates a splash drawable and a splash theme that uses that drawable as windowBackground.
    //   - Then we update the manifest to use the splash theme for the MainActivity.

    // Create the splash drawable (layer-list)
    const splashDrawablePath = path.join(drawableFolder, "splash.xml");
    let splashDrawable = `<item>`;
    if (backgroundPath) {
        // We have a background image
        splashDrawable += `<bitmap android:src="@drawable/splash_background" android:gravity="fill" />`;
    } else {
        // Use a color background - we'll use the windowBackground from the theme
        splashDrawable += `<color android:color="?attr/colorBackground" />`;
    }
    if (logoPath) {
        splashDrawable += `<item>`;
        splashDrawable += `<bitmap android:src="@drawable/splash_logo" android:gravity="center" />`;
        splashDrawable += `</item>`;
    }
    splashDrawable += `</item>`;

    await fs.writeFile(splashDrawablePath, splashDrawable);
    console.log("Splash drawable created.");

    // Create the splash theme
    // We'll update the themes.xml to include a splash theme.
    const themesPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "res",
        "values",
        "themes.xml"
    );

    let themes = await fs.readFile(themesPath, "utf8");

    // Check if we already have a splash theme, if not, add it.
    if (!themes.includes("<style name=\"SplashTheme\"")) {
        // We'll add the splash theme before the closing </resources> tag
        themes = themes.replace(/<\/resources>/, `\n    <style name=\"SplashTheme\" parent=\"Theme.AppForgeTemplate.NoActionBar\">\n        <item name=\"android:windowBackground\">@drawable/splash</item>\n        <!-- Optional: status bar color -->\n        <item name=\"android:statusBarColor\">@android:color/transparent</item>\n    </style>\n</resources>`);
        await fs.writeFile(themesPath, themes);
        console.log("Splash theme added to themes.xml");
    }

    // Now, we need to update the AndroidManifest.xml to use the SplashTheme for the MainActivity.
    const manifestPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "AndroidManifest.xml"
    );

    let manifest = await fs.readFile(manifestPath, "utf8");

    // We want to set the theme of the MainActivity to SplashTheme
    // We look for the activity tag for MainActivity and add the android:theme attribute.
    manifest = manifest.replace(/(<activity[^>]*android:name=\\\".*MainActivity[^>]*>)/, `$1 android:theme=\\\"@style/SplashTheme\\\"`);

    await fs.writeFile(manifestPath, manifest);
    console.log("MainActivity theme set to SplashTheme in AndroidManifest.xml");

    console.log("Splash screen updated successfully");
}

module.exports = {
    updateSplashScreen
};
