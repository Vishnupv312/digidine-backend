const express = require("express");
const Restaurant = require("../models/restaurant-model");
const router = express.Router();
const Restaurant = require("../models/restaurant-model.js");
const { registration } = require("../controllers/auth-controller");
router.post("/registration", async (req, res) => {
  try {
    let { email, password } = req.body;
    let findRestaurant = await Restaurant.findOne({ email });
    if (findRestaurant)
      res.status(301).json({ message: "user already exists" });
    else {
      registration(req, res);
    }
  } catch (err) {
    console.log(err.message);
  }
});
