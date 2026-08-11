const express = require("express");
const path = require("path");
const fs = require("fs-extra");
const { getDownloadUrl } = require("../services/r2.service");

const router = express.Router();

router.get("/:buildId", async (req, res) => {

    const buildId = req.params.buildId;
    const useR2 = req.query.r2 !== "false"; // Default to R2, use ?r2=false for local

    // Option 1: Redirect to R2 pre-signed URL (expires in 1 hour)
    if (useR2) {
        try {
            const signedUrl = await getDownloadUrl(buildId, "app.apk", 3600);
            return res.redirect(signedUrl);
        } catch (r2Error) {
            console.warn("Failed to get R2 signed URL, falling back to local:", r2Error.message);
            // Fall through to local
        }
    }

    // Option 2: Serve from local filesystem
    const apkPath = path.join(
        __dirname,
        "..",
        "builds",
        buildId,
        "output",
        "app.apk"
    );

    if (!(await fs.pathExists(apkPath))) {
        return res.status(404).json({
            success: false,
            message: "APK not found"
        });
    }

    const stat = await fs.stat(apkPath);

    console.log("Downloading:", apkPath);
    console.log("Size:", stat.size);

    res.setHeader(
        "Content-Type",
        "application/vnd.android.package-archive"
    );

    res.setHeader(
        "Content-Disposition",
        'attachment; filename="app.apk"'
    );

    return res.sendFile(apkPath);

});

module.exports = router;