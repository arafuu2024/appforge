const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");

const uploadFolder = path.join(__dirname, "..", "uploads");

fs.ensureDirSync(uploadFolder);

const storage = multer.diskStorage({

    destination(req, file, cb) {
        cb(null, uploadFolder);
    },

    filename(req, file, cb) {

        const extension = path.extname(file.originalname);

        cb(
            null,
            "icon-" + Date.now() + extension
        );

    }

});

const upload = multer({

    storage,

    fileFilter(req, file, cb) {

        if (!file.mimetype.startsWith("image/")) {

            return cb(
                new Error("Only images are allowed.")
            );

        }

        cb(null, true);

    }

});

module.exports = upload;