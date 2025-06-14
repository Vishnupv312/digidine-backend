const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const RestaurantModel = require("../models/restaurant-model");
const { generateToken } = require("../utils/generate-token");
const { generateUniqueSlug } = require("../utils/generate-unique-slug");

module.exports.registration = async (req, res) => {
  let { email, password, restaurantName, fullName } = req.body;
  try {
    let salt = await bcrypt.genSalt(10);

    if (salt) {
      let hashPassword = await bcrypt.hash(password, salt);
      let uniqueSlug = await generateUniqueSlug(restaurantName);
      const createdRestaurant = await RestaurantModel.create({
        restaurantName,
        email,
        ownerName: fullName,
        password: hashPassword,
        slug: uniqueSlug,
      });
      let token = generateToken(createdRestaurant);
      res
        .status(200)
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
          maxAge: 24 * 60 * 60 * 1000,
          sameSite: "lax",
        })
        .json({
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
        .cookie("token", jwtToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          maxAge: 24 * 60 * 60 * 1000,
        })

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

module.exports.loginStatus = async (req, res) => {
  try {
    let token = req.cookies?.token;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded) {
      res.status(200).json({
        success: true,
        authenticated: true,
      });
    } else {
      res.status(401).json({
        success: false,
        authenticated: false,
        message: "Unauthorized",
      });
    }
  } catch (err) {
    console.log(err.message);
    res
      .status(500)
      .json({ message: "something went wrong", error: err.message });
  }
};

module.exports.logout = async (req, res) => {
  let token = req.cookies?.token;

  try {
    if (!token) res.status(401).json({ message: "Token not found " });
    res
      .status(200)
      .clearCookie("token", {
        httpOnly: true,
        sameSite: "Lax", // or "Lax" based on your app's needs
        secure: false, // only over HTTPS in production
      })
      .json({ message: "Logged out sucessfully" });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Something went wrong ", error: err.message });
  }
};
//for logout set cookie in res and then delete it
