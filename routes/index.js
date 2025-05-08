// routes/index.js
const express = require("express");
const authRoutes = require("./auth-routes");
const menuRoutes = require("./menu-routes");
const router = express.Router();

// All routes will be prefixed with /api already from server.js
router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);

module.exports = router;
