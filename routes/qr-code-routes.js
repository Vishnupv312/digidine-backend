const express = require("express");
const { verifyToken } = require("../middlewares/auth-middleware");
const {
  GenerateQRCode,
  FetchQrCode,
  UpdateQRCodeTheme,
} = require("../controllers/qr-code-controller");
const router = express.Router();

router.post("/generate", verifyToken, GenerateQRCode);
router.get("/fetch", verifyToken, FetchQrCode);
// Add this to your existing routes
router.put("/:id/theme", verifyToken, UpdateQRCodeTheme);
module.exports = router;
