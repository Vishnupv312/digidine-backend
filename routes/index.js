// routes/index.js
const express = require("express");
const authRoutes = require("./auth-routes");
const menuRoutes = require("./menu-routes");
const qrRoutes = require("./qr-code-routes");
const paymentRoutes = require("./payment-routes");
const userRoutes = require("./user-routes");
const settingsRoutes = require("./setttings.route");
const router = express.Router();

// All routes will be prefixed with /api already from server.js
router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);
router.use("/qr-code", qrRoutes);
router.use("/v1/payments", paymentRoutes);
router.use("/user", userRoutes);
router.use("/settings", settingsRoutes);
module.exports = router;
