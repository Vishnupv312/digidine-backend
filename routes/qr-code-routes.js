const express = require("express");
const { verifyToken } = require("../middlewares/auth-middleware");
const { GenerateQRCode } = require("../controllers/qr-code-controller");
const router = express.Router();

router.get("/generate", verifyToken, GenerateQRCode);

module.exports = router;
