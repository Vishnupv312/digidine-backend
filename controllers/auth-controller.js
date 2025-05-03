const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const RestaurantModel = require("../models/restaurant-model");
const { generateToken } = require("../utils/generate-token");

module.exports.registration = async (req, res) => {
  let { email, password } = req.body;
  try {
    let salt = await bcrypt.genSalt(10);
    if (salt) {
      let hashPassword = await bcrypt.hash(password, salt);
      const createdRestaurant = await RestaurantModel.create({
        email,
        password: hashPassword,
      });
      let token = generateToken(createdRestaurant);
      res.status(200).json({
        token: token,
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

module.exports.login = async (req, res, findRestaurant) => {
  try {
    let { email, password } = req.body;
    let passwordCompare = await bcrypt.compare(
      password,
      findRestaurant.password
    );
    if (passwordCompare) {
      let jwtToken = generateToken(findRestaurant);
      res
        .status(200)
        .json({ token: jwtToken, message: "User logged in Succefully" });
    } else {
      res.status(301).json({ message: "Email or Password Incorrect" });
    }
  } catch (err) {
    res
      .status(301)
      .json({ message: "Something Went wrong", errror: err.message });
  }
};
module.exports.changePassword = async (req, res) => {
  try {
    let { oldPassword, newPassword } = req.body;

    // Find user - MISSING AWAIT
    let findUser = await RestaurantModel.findOne({ _id: req.user.id });

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let passwordCheck = await bcrypt.compare(oldPassword, findUser.password);

    if (!passwordCheck) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    let salt = await bcrypt.genSalt(10);
    let hashPassword = await bcrypt.hash(newPassword, salt);

    // INCORRECT UPDATE SYNTAX - should use object with field names
    let updateRestaurant = await RestaurantModel.updateOne(
      { _id: req.user.id },
      { $set: { password: hashPassword } } // Correct syntax with field name
    );

    if (updateRestaurant.modifiedCount > 0) {
      return res.status(200).json({ message: "Password updated successfully" });
    } else {
      return res.status(400).json({ message: "Failed to update password" });
    }
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({
      message: "Server error while changing password",
      error: err.message,
    });
  }
};
