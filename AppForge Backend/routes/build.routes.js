const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const { buildProject } = require("../controllers/build.controller");

router.post("/", upload.single("icon"), buildProject);

module.exports = router;