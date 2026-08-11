// ABSOLUTE FIRST LINE: nothing can crash before this prints
console.log('CLI-BUILD STARTED pid=' + process.pid + ' argv=' + JSON.stringify(process.argv));
console.log('ENV BUILD_CONFIG=' + (process.env.BUILD_CONFIG ? process.env.BUILD_CONFIG.length + ' chars' : 'EMPTY'));

// cli-build.js - Entry point for GitHub Actions APK Build
// This script runs the complete Android build pipeline in a cloud environment

// ============================
// RAW DIAGNOSTICS: Log what we receive BEFORE any parsing/fallbacks
// ============================
console.log('\n' + '='.repeat(80));
console.log('〓 cli-build.js RAW INPUT DIAGNOSTICS');
console.log('='.repeat(80));
console.log('process.argv (raw):');
process.argv.forEach((arg, i) => {
    console.log(`  [${i}]: ${JSON.stringify(arg)} (type: ${typeof arg}, length: ${arg ? arg.length : 0})`);
});
console.log('');
console.log('Environment variables:');
console.log(`  GITHUB_WORKFLOW: ${process.env.GITHUB_WORKFLOW || 'not set'}`);
console.log(`  GITHUB_ACTION: ${process.env.GITHUB_ACTION || 'not set'}`);
console.log(`  BUILD_CONFIG exists: ${!!process.env.BUILD_CONFIG}`);
if (process.env.BUILD_CONFIG) {
    const cfg = process.env.BUILD_CONFIG;
    console.log(`  BUILD_CONFIG length: ${cfg.length} chars`);
    console.log(`  BUILD_CONFIG preview (first 100): ${cfg.substring(0, 100)}`);
}
console.log('='.repeat(80) + '\n');

const path = require('path');
const fs = require('fs-extra');
const { execSync } = require('child_process');

// Load environment variables from .env if it exists (for local testing)
try {
    require('dotenv').config();
} catch (e) {
    // dotenv not available in Actions, use env vars directly
}

// Import services
const { updatePackage } = require('./services/package.service');
const { updateTemplate } = require('./services/template.service');
const { updateAppName } = require('./services/manifest.service');
const { updateVersion } = require('./services/version.service');
const { replaceAppIcons } = require('./services/icon.service');
const { updateSplashScreen } = require('./services/splash.service');
const { updatePermissions } = require('./services/permissions.service');
const { updateTheme } = require('./services/theme.service');
const { setupAdMob } = require('./services/admob.service');
const { updateWebViewFeatures } = require('./services/webview.service');
const { buildAPK } = require('./services/apk.service');
const { uploadBuild } = require('./services/r2.service');

// Supabase client for status updates
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

async function updateBuildStatus(buildId, status, metadata = {}) {
    if (!supabase) {
        console.log(`⚠️ Supabase not configured, skipping status update for ${buildId}`);
        return;
    }
    
    try {
        const { error } = await supabase
            .from('builds')
            .update({
                status,
                updated_at: new Date().toISOString(),
                ...metadata
            })
            .eq('id', buildId);
            
        if (error) {
            console.error(`Failed to update build status: ${error.message}`);
        } else {
            console.log(`✅ Build ${buildId} status updated to: ${status}`);
        }
    } catch (e) {
        console.error(`Error updating Supabase: ${e.message}`);
    }
}

async function run() {
    // ============================
    // PARSE & VALIDATE INPUTS
    // ============================
    const websiteUrl = process.argv[2] || 'https://example.com';
    console.log(`\nParsed websiteUrl: "${websiteUrl}"`);

    // Build ID handling with validation
    let buildId = process.argv[3];
    
    // VALIDATION: Detect if buildId looks like a package name (wrong argument position)
    if (buildId && buildId.includes('.')) {
        console.error(`⚠️ WARNING: buildId "${buildId}" looks like a package name (contains dots)`);
        console.error(`⚠️ This suggests arguments are misordered or the input field was misused.`);
        buildId = null; // Force fallback to generated ID
    }
    
    if (!buildId || buildId.trim() === '') {
        buildId = `build-${Date.now()}`;
        console.log(`No valid build ID from args, generated: ${buildId}`);
    }
    
    // Sanitize
    const originalBuildId = buildId;
    buildId = buildId.replace(/[^a-zA-Z0-9-_]/g, '');
    if (buildId !== originalBuildId) {
        console.log(`Sanitized build ID: "${originalBuildId}" -> "${buildId}"`);
    }
    
    console.log(`\nParsed buildId: "${buildId}"`);

    // ============================
    // CONFIG PARSING
    // ============================
    console.log('\nParsing BUILD_CONFIG...');
    
    let configJson = process.env.BUILD_CONFIG || '';
    
    // Try base64 decode first
    if (configJson) {
        try {
            const decoded = Buffer.from(configJson, 'base64').toString('utf8');
            if (decoded.startsWith('{')) {
                console.log('  - BUILD_CONFIG is base64-encoded');
                configJson = decoded;
            } else {
                console.log('  - BUILD_CONFIG is raw JSON');
            }
        } catch (e) {
            console.log('  - BUILD_CONFIG is not base64, using as-is');
        }
    }
    
    // Fallback to CLI arg
    if (!configJson && process.argv[4]) {
        console.log('  - No BUILD_CONFIG env, falling back to argv[4]');
        configJson = process.argv[4];
        console.log(`  - argv[4] content: ${JSON.stringify(configJson)}`);
    }
    
    let config = {};
    try {
        config = JSON.parse(configJson || '{}');
        console.log(`  - Parsed successfully. packageName: "${config.packageName || '(not set)'}"`);
    } catch (e) {
        console.error(`  - FAILED to parse BUILD_CONFIG: ${e.message}`);
        console.error(`  - Input was: ${configJson.substring(0, 100)}`);
        process.exit(1);
    }
    
    // Package name: MUST be independent of buildId
    const packageName = config.packageName || 'com.appforge.generated';
    console.log(`\nResolved packageName: "${packageName}"`);
    console.log('\n' + '='.repeat(60));
    console.log('DIAGNOSTIC: Final resolved values');
    console.log('='.repeat(60));
    console.log(`  buildId: "${buildId}"`);
    console.log(`  packageName: "${packageName}"`);
    console.log(`  websiteUrl: "${websiteUrl}"`);
    console.log(`  appName: "${config.appName || 'My App'}"`);
    console.log('='.repeat(60) + '\n');
    
    const project = {
        appName: config.appName || 'My App',
        packageName: packageName,
        website: websiteUrl,
        versionName: config.versionName || '1.0.0',
        versionCode: parseInt(config.versionCode) || 1,
        themeMode: config.themeMode || 'light',
        primaryColor: config.primaryColor || '#4F7CFF',
        accentColor: config.accentColor || '#7C3AED',
        permissions: config.permissions || ['INTERNET'],
        admobConfig: config.admobConfig || null,
        splashLogo: config.splashLogo || null,
        splashBackground: config.splashBackground || null,
        user_email: config.user_email || process.env.GITHUB_ACTOR || 'ci@appforge.local',
        enableFileDownload: config.enableFileDownload || true,
        enableFileUpload: config.enableFileUpload || true,
        enableGeolocation: config.enableGeolocation || true,
        enableOfflineMode: config.enableOfflineMode || true,
        enablePullToRefresh: config.enablePullToRefresh || true,
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('BUILD STARTING');
    console.log('='.repeat(60));
    console.log(`  Build ID: "${buildId}"`);
    console.log(`  Website: "${project.website}"`);
    console.log(`  App Name: "${project.appName}"`);
    console.log(`  Package: "${project.packageName}"`);
    console.log(`  User: "${project.user_email}"`);
    console.log('='.repeat(60) + '\n');
    
    console.log(`🚀 Starting GitHub Actions Build: ${buildId}`);
    console.log(`📱 Website: ${websiteUrl}`);
    console.log(`📦 Package: ${project.packageName}`);
    console.log(`👤 User: ${project.user_email}`);
    
    // Update status to processing
    await updateBuildStatus(buildId, 'processing');
    
    const buildFolder = path.join(__dirname, 'builds', buildId);
    const templateFolder = path.join(__dirname, 'android-template');
    
    try {
        // Step 1: Copy template
        console.log('\n📁 Step 1: Copying Android template...');
        await fs.ensureDir(buildFolder);
        await fs.copy(templateFolder, path.join(buildFolder, 'android'));
        
        // Step 2: Update package name
        console.log('\n📦 Step 2: Updating package name...');
        await updatePackage(buildFolder, project.packageName);
        
        // Step 3: Update template (website URL)
        console.log('\n⚙️ Step 3: Updating website URL...');
        await updateTemplate(buildFolder, project);
        
        // Step 4: Update app name
        console.log('\n📱 Step 4: Updating app name...');
        await updateAppName(buildFolder, project);
        
        // Step 5: Update version
        console.log('\n🔢 Step 5: Updating version...');
        await updateVersion(buildFolder, project.versionName, project.versionCode);
        
        // Step 6: Replace app icons
        console.log('\n🎨 Step 6: Setting up icons...');
        if (project.iconUrl) {
            try {
                // Download icon from URL
                const axios = require('axios');
                const iconRes = await axios.get(project.iconUrl, { responseType: 'arraybuffer' });
                const iconPath = path.join(buildFolder, 'icon.png');
                await fs.writeFile(iconPath, Buffer.from(iconRes.data));
                await replaceAppIcons(buildFolder, iconPath);
                await fs.remove(iconPath);
                console.log('✅ Icons replaced');
            } catch (e) {
                console.warn('⚠️ Icon processing skipped (build continues):', e.message);
                // Don't fail the build for icon issues - use default
            }
        } else {
            console.log('ℹ️ No icon provided, using default');
        }
        
        // Step 7: Update splash screen
        console.log('\n🖼️ Step 7: Setting up splash screen...');
        if (project.splashLogo || project.splashBackground) {
            try {
                await updateSplashScreen(
                    buildFolder,
                    project.splashLogo,
                    project.splashBackground,
                    config.loadingAnimation
                );
                console.log('✅ Splash screen updated');
            } catch (e) {
                console.warn('⚠️ Splash screen skipped (build continues):', e.message);
            }
        } else {
            console.log('ℹ️ No splash screen assets provided, using default');
        }
        
        // Step 8: Update permissions
        console.log('\n🔐 Step 8: Updating permissions...');
        await updatePermissions(buildFolder, project.permissions);
        
        // Step 9: Update theme
        console.log('\n🎨 Step 9: Applying theme...');
        await updateTheme(buildFolder, project.themeMode, project.primaryColor, project.accentColor);
        
        // Step 10: Setup AdMob
        console.log('\n📢 Step 10: AdMob configuration...');
        if (project.admobConfig && project.admobConfig.appId) {
            await setupAdMob(buildFolder, project.admobConfig, project.packageName);
        }
        
        // Step 11: Update WebView features
        console.log('\n🌐 Step 11: Configuring WebView features...');
        await updateWebViewFeatures(buildFolder, project);
        
        // Step 12: Build APK
        console.log('\n🔨 Step 12: Building APK with Gradle...');
        
        const androidFolder = path.join(buildFolder, 'android');
        const gradlewPath = path.join(androidFolder, 'gradlew');
        
        // Make gradlew executable on Unix-like systems
        if (process.platform !== 'win32') {
            try {
                fs.chmodSync(gradlewPath, 0o755);
                console.log('✅ Made gradlew executable');
            } catch (e) {
                console.warn('⚠️ Could not chmod gradlew:', e.message);
            }
        }
        
        // Add --no-daemon for CI and set JAVA_HOME if not set
        const buildEnv = { ...process.env };
        if (!buildEnv.JAVA_HOME && process.platform === 'linux') {
            // Common Java location on GitHub Actions
            const possibleJavaHomes = [
                '/usr/lib/jvm/temurin-17-jdk-amd64',
                '/usr/lib/jvm/java-17-temurin',
                process.env.JAVA_HOME_17_X64
            ];
            for (const p of possibleJavaHomes) {
                if (p && await fs.pathExists(p)) {
                    buildEnv.JAVA_HOME = p;
                    console.log(`✅ Set JAVA_HOME to: ${p}`);
                    break;
                }
            }
        }
        
        await buildAPK(buildFolder);
        
        // Verify APK exists
        const apkPath = path.join(buildFolder, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');
        if (!(await fs.pathExists(apkPath))) {
            throw new Error('APK was not generated by Gradle');
        }
        
        console.log(`✅ APK built successfully: ${apkPath}`);
        
        // Step 13: Upload to R2
        console.log('\n☁️ Step 13: Uploading to Cloudflare R2...');
        const r2FilePath = await uploadBuild(buildId, apkPath, 'app.apk');
        console.log(`✅ Uploaded to R2: ${r2FilePath}`);
        
        // Step 14: Update status to completed
        await updateBuildStatus(buildId, 'completed', {
            r2_file_path: r2FilePath,
            completed_at: new Date().toISOString()
        });
        
        // Output for GitHub Actions (modern $GITHUB_OUTPUT syntax)
        console.log('\n' + '='.repeat(50));
        console.log('🎉 BUILD COMPLETED SUCCESSFULLY');
        console.log('='.repeat(50));
        const ghOutput = process.env.GITHUB_OUTPUT;
        if (ghOutput) {
            fs.appendFileSync(ghOutput, `apk-path=${apkPath}\n`);
            fs.appendFileSync(ghOutput, `r2-path=${r2FilePath}\n`);
            fs.appendFileSync(ghOutput, `build-id=${buildId}\n`);
        } else {
            // Fallback for local testing
            console.log(`apk-path: ${apkPath}`);
            console.log(`r2-path: ${r2FilePath}`);
            console.log(`build-id: ${buildId}`);
        }
        console.log('='.repeat(50));
        
        // Cleanup local files to save space
        console.log('\n🧹 Cleaning up local build files...');
        await fs.remove(buildFolder);
        
    } catch (error) {
        console.error('\n' + '='.repeat(50));
        console.error('❌ BUILD FAILED');
        console.error('='.repeat(50));
        console.error('Error:', error.message);
        console.error(error.stack);
        
        // Update status to failed
        await updateBuildStatus(buildId, 'failed', {
            error_message: error.message
        });
        
        // Set error output for GitHub Actions
        const ghOutput = process.env.GITHUB_OUTPUT;
        if (ghOutput) {
            fs.appendFileSync(ghOutput, `error=true\n`);
            fs.appendFileSync(ghOutput, `error-message=${error.message}\n`);
        } else {
            console.log(`error: true`);
            console.log(`error-message: ${error.message}`);
        }
        
        process.exit(1);
    }
}

// Run the build
run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});