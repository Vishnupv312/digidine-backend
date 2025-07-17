const express = require("express");
const { verifyToken } = require("../middlewares/auth-middleware");
const { UpdateOwnerData } = require("../controllers/user-controller");
const router = express.Router();

router.put("/update-restaurant-owner", verifyToken, UpdateOwnerData);

module.exports = router;
