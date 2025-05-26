const express = require("express");
const router = express.Router();
const RestaurantModel = require("../models/restaurant-model.js");
const {
  registration,
  login,
  changePassword,
  loginStatus,
  logout,
} = require("../controllers/auth-controller");
const { verifyToken } = require("../middlewares/auth-middleware.js");

router.post("/registration", async (req, res) => {
  try {
    let { email, password } = req.body;
    let findRestaurant = await RestaurantModel.findOne({ email });
    if (findRestaurant)
      res.status(301).json({ message: "user already exists" });
    else {
      registration(req, res);
    }
  } catch (err) {
    console.log(err.message);
  }
});

router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    let findRestaurant = await RestaurantModel.findOne({ email });
    if (findRestaurant) {
      login(req, res, findRestaurant);
    } else {
      res.status(401).json({ message: "Email or Password is incorrect" });
    }
  } catch (err) {
    res.status(401).json({
      message: "something went wrong, please try again ",
      error: `${err.message}`,
    });
  }
});

router.post("/change-password", verifyToken, changePassword);

router.get("/logout", logout);
router.get("/me", loginStatus);

module.exports = router;
