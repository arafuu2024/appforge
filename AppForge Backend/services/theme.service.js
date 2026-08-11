const fs = require("fs-extra");
const path = require("path");

async function updateTheme(buildFolder, themeMode, primaryColor, accentColor) {
    console.log("Updating Theme...");

    // Update colors.xml
    const colorsPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "res",
        "values",
        "colors.xml"
    );

    let colors = await fs.readFile(colorsPath, "utf8");

    // Replace or add primary and accent colors
    // We'll replace the existing colors or add them if they don't exist
    colors = colors.replace(/<color name="colorPrimary">#[0-9A-Fa-f]{6}<\/color>/, `<color name="colorPrimary">${primaryColor}</color>`);
    colors = colors.replace(/<color name="colorAccent">#[0-9A-Fa-f]{6}<\/color>/, `<color name="colorAccent">${accentColor}</color>`);

    // If the colors don't exist, we add them
    if (!colors.includes(`<color name="colorPrimary">${primaryColor}</color>`)) {
        // Insert before the closing </resources> tag
        colors = colors.replace(/<\/resources>/, `    <color name="colorPrimary">${primaryColor}</color>\n</resources>`);
    }
    if (!colors.includes(`<color name="colorAccent">${accentColor}</color>`)) {
        colors = colors.replace(/<\/resources>/, `    <color name="colorAccent">${accentColor}</color>\n</resources>`);
    }

    await fs.writeFile(colorsPath, colors);

    // Update themes.xml (light and dark)
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

    // Update the primary and accent colors in the theme
    themes = themes.replace(/<item name="colorPrimary">#[0-9A-Fa-f]{6}<\/item>/, `<item name="colorPrimary">${primaryColor}</item>`);
    themes = themes.replace(/<item name="colorAccent">#[0-9A-Fa-f]{6}<\/item>/, `<item name="colorAccent">${accentColor}</item>`);

    // If the items don't exist, we add them
    if (!themes.includes(`<item name="colorPrimary">${primaryColor}</item>`)) {
        // We'll insert inside the Base.Theme.AppForgeTemplate style
        themes = themes.replace(/(<style name="Base.Theme.AppForgeTemplate"[^>]*>)/, `$1\n        <item name="colorPrimary">${primaryColor}</item>`);
        themes = themes.replace(/(<style name="Base.Theme.AppForgeTemplate"[^>]*>.*<item name="colorPrimary"[^>]*>[^<]*<\/item>)/, `$1\n        <item name="colorAccent">${accentColor}</item>`);
    }
    if (!themes.includes(`<item name="colorAccent">${accentColor}</item>`)) {
        themes = themes.replace(/(<style name="Base.Theme.AppForgeTemplate"[^>]*>.*<item name="colorAccent"[^>]*>[^<]*<\/item>)/, `$1\n        <item name="colorPrimary">${primaryColor}</item>`);
    }

    await fs.writeFile(themesPath, themes);

    // Update themes.xml (night/dark)
    const themesNightPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "res",
        "values-night",
        "themes.xml"
    );

    let themesNight = await fs.readFile(themesNightPath, "utf8");

    // For dark theme, we might want to adjust the colors, but for simplicity we use the same
    // In a real app, you might have different colors for dark theme
    themesNight = themesNight.replace(/<item name="colorPrimary">#[0-9A-Fa-f]{6}<\/item>/, `<item name="colorPrimary">${primaryColor}</item>`);
    themesNight = themesNight.replace(/<item name="colorAccent">#[0-9A-Fa-f]{6}<\/item>/, `<item name="colorAccent">${accentColor}</item>`);

    if (!themesNight.includes(`<item name="colorPrimary">${primaryColor}</item>`)) {
        themesNight = themesNight.replace(/(<style name="Base.Theme.AppForgeTemplate"[^>]*>)/, `$1\n        <item name="colorPrimary">${primaryColor}</item>`);
        themesNight = themesNight.replace(/(<style name="Base.Theme.AppForgeTemplate"[^>]*>.*<item name="colorPrimary"[^>]*>[^<]*<\/item>)/, `$1\n        <item name="colorAccent">${accentColor}</item>`);
    }
    if (!themesNight.includes(`<item name="colorAccent">${accentColor}</item>`)) {
        themesNight = themesNight.replace(/(<style name="Base.Theme.AppForgeTemplate"[^>]*>.*<item name="colorAccent"[^>]*>[^<]*<\/item>)/, `$1\n        <item name="colorPrimary">${primaryColor}</item>`);
    }

    await fs.writeFile(themesNightPath, themesNight);

    // Update the theme mode in the AndroidManifest.xml if needed?
    // Actually, the theme mode is handled by the system and the app's theme.
    // We don't need to change the manifest for theme mode.
    // However, if we want to force a specific theme (light or dark) we can set it in the manifest.
    // But the requirement is to respect the system theme by default, and allow the user to choose.
    // We'll leave the manifest as is and let the system handle it.
    // If we want to force light or dark, we can add:
    //   android:theme="@style/Theme.AppForgeTemplate" (which is daynight and will follow system)
    // To force light: android:theme="@style/Theme.AppForgeTemplate.Light"
    // To force dark: android:theme="@style/Theme.AppForgeTemplate.Dark"
    // We don't have Light and Dark themes defined, so we'll stick with DayNight.
    // If the user selects light or dark, we can change the theme in the manifest.
    // But note: the frontend sends theme_mode: "light", "dark", or "system".
    // We'll update the manifest accordingly.

    const manifestPath = path.join(
        buildFolder,
        "android",
        "app",
        "src",
        "main",
        "AndroidManifest.xml"
    );

    let manifest = await fs.readFile(manifestPath, "utf8");

    // We'll set the theme in the application tag
    let themeAttr = "android:theme=\"@style/Theme.AppForgeTemplate\""; // Default is daynight (system)
    if (themeMode === "light") {
        themeAttr = "android:theme=\"@style/Theme.AppForgeTemplate.Light\"";
    } else if (themeMode === "dark") {
        themeAttr = "android:theme=\"@style/Theme.AppForgeTemplate.Dark\"";
    }
    // For "system", we keep the default.

    // Replace the existing theme attribute or add it
    manifest = manifest.replace(/android:theme="@style\/[^"]*"/, themeAttr);
    
    // If there was no theme attribute, we add it
    if (!manifest.includes("android:theme=")) {
        manifest = manifest.replace(/<application/, `<application ${themeAttr}`);
    }

    await fs.writeFile(manifestPath, manifest);

    console.log("Theme updated successfully");
}

module.exports = {
    updateTheme
};