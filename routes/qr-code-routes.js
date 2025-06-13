const express = require("express");
const { verifyToken } = require("../middlewares/auth-middleware");
const {
  GenerateQRCode,
  FetchQrCode,
} = require("../controllers/qr-code-controller");
const router = express.Router();

router.post("/generate", verifyToken, GenerateQRCode);
router.get("/fetch", verifyToken, FetchQrCode);
module.exports = router;
