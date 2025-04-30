const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Restaurant = require("../models/restaurant-model");
const { generateToken } = require("../utils/generate-token");

module.exports.registration = async (req, res) => {
  let { email, password } = req.body;
  try {
    let salt = await bcrypt.genSalt(10);
    if (salt) {
      let hashPassword = await bcrypt.hash(password, salt);
      const createdRestaurant = await restaurantModel.create({
        email,
        password: hashPassword,
      });
      let token = generateToken(createdRestaurant);
      res.status(200).json({
        message: "user created succesfully",
      });
    }
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
    console.log(err);
  }
};
