const express = require("express");
const cors = require("cors");
require("dotenv").config();

const buildRoutes = require("./routes/build.routes");
const downloadRoutes = require("./routes/download.routes");

console.log(buildRoutes);

const app = express();

app.use(cors());
app.use(express.json());

// Home
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 AppForge Backend Running"
    });
});

// Health
app.get("/health", (req, res) => {
    res.json({
        status: "online"
    });
});

app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});
// Build API
app.use("/build", buildRoutes);

// Download API ✅
app.use("/download", downloadRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});