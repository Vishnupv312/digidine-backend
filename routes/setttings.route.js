const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middlewares/auth-middleware");
const {
  FetchProfile,
  AddProfileData,
} = require("../controllers/settting.controller");

router.get("/profile", verifyToken, FetchProfile);
router.post("/profile", verifyToken, AddProfileData);

module.exports = router;
