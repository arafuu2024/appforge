const { v4: uuidv4 } = require("uuid");

async function buildProject(req, res) {
    const buildId = uuidv4();

    try {
        console.log(`🚀 Triggering GitHub Actions Build: ${buildId}`);

        // Parse project data
        const project = JSON.parse(req.body.project);
        const userEmail = req.body.user_email || project.user_email || "anonymous@example.com";

        // Add defaults and prepare config
        const buildConfig = {
            appName: project.appName || 'My App',
            packageName: project.packageName || `com.appforge.${Date.now()}`,
            website: project.website,
            versionName: project.versionName || '1.0.0',
            versionCode: project.versionCode || 1,
            themeMode: project.themeMode || 'light',
            primaryColor: project.primaryColor || '#4F7CFF',
            accentColor: project.accentColor || '#7C3AED',
            permissions: project.permissions || ['INTERNET'],
            admobConfig: project.admobConfig || null,
            splashLogo: project.splashLogo || null,
            splashBackground: project.splashBackground || null,
            user_email: userEmail,
            iconUrl: project.iconUrl || null,
            enableFileDownload: project.enableFileDownload !== false,
            enableFileUpload: project.enableFileUpload !== false,
            enableGeolocation: project.enableGeolocation !== false,
            enableOfflineMode: project.enableOfflineMode !== false,
            enablePullToRefresh: project.enablePullToRefresh !== false,
            loadingAnimation: project.loadingAnimation || null
        };

        // Log config (without sensitive data)
        console.log('📋 Build config:', {
            appName: buildConfig.appName,
            packageName: buildConfig.packageName,
            website: buildConfig.website,
            version: buildConfig.versionName,
            user_email: buildConfig.user_email
        });

        // Option A: Trigger GitHub Actions (Production - Recommended)
        const ghRepo = process.env.GITHUB_REPO || "arafuu2024/appforfe";
        const ghWorkflow = process.env.GITHUB_WORKFLOW_FILE || "build-test.yml";
        const ghRef = process.env.GITHUB_BRANCH || "main";

        if (process.env.GITHUB_PAT) {
            try {
                const triggerResponse = await fetch(
                    `https://api.github.com/repos/${ghRepo}/actions/workflows/${ghWorkflow}/dispatches`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `token ${process.env.GITHUB_PAT}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            ref: ghRef,
                            inputs: {
                                website_url: buildConfig.website,
                                build_id: buildId,
                                config: JSON.stringify(buildConfig)
                            }
                        })
                    }
                );

                if (!triggerResponse.ok) {
                    const errorText = await triggerResponse.text();
                    throw new Error(`GitHub API error: ${triggerResponse.status} - ${errorText}`);
                }

                console.log(`✅ GitHub Actions build triggered: ${buildId}`);

                return res.json({
                    success: true,
                    buildId,
                    message: "Build triggered on GitHub Actions",
                    status: "processing",
                    trackingUrl: `/build/${buildId}`, // Supabase row ID
                    buildConfig: {
                        estimatedTime: "5-10 minutes",
                        platform: "GitHub Actions"
                    }
                });

            } catch (githubError) {
                console.error('GitHub Actions trigger failed:', githubError);
                console.log('Falling back to local build...');
                // Fall through to local build
            }
        }

        // Option B: Local Build (Development - Deprecated)
        console.log('🔨 Starting local build (development mode)...');
        console.log('⚠️ WARNING: Local builds require Java JDK and Android SDK');
        
        // Set a timeout for the entire build process
        const buildTimeout = 20 * 60 * 1000; // 20 minutes
        req.setTimeout(buildTimeout);
        
        // Local build implementation would go here
        // For now, return a helpful error
        return res.status(503).json({
            success: false,
            buildId,
            message: "Local builds are disabled. Please configure GitHub Actions or contact administrator.",
            instructions: "Set GITHUB_PAT and GITHUB_ACTIONS=true in .env to enable cloud builds"
        });

    } catch (error) {
        console.error(`❌ Build trigger failed: ${buildId}`, error);
        
        return res.status(500).json({
            success: false,
            error: "Failed to initiate build",
            details: error.message
        });
    }
}

module.exports = {
    buildProject
};