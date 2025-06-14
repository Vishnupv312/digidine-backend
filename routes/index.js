// routes/index.js
const express = require("express");
const authRoutes = require("./auth-routes");
const menuRoutes = require("./menu-routes");
const qrRoutes = require("./qr-code-routes");
const paymentRoutes = require("./payment-routes");
const router = express.Router();

// All routes will be prefixed with /api already from server.js
router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);
router.use("/qr-code", qrRoutes);
router.use("/v1/payments", paymentRoutes);
module.exports = router;
