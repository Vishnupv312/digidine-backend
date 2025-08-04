const restaurantSettingModel = require("../models/restaurant-setting.model");
const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;

module.exports.AddProfileData = async (req, res) => {
  let id = req.user.id;

  try {
    let {
      restaurantName,
      theme,
      restaurantLogo,
      restaurantBannerImage,
      website,
      address,
      description,
      openingHours,
    } = req.body;

    let restaurantDetails = await restaurantSettingModel.findOneAndUpdate(
      { restaurantId: id }, // filter
      {
        $set: {
          restaurantName,
          theme,
          restaurantLogo,
          restaurantBannerImage,
          website,
          address,
          description,
          openingHours,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      message: "Profile data added/updated successfully",
      data: restaurantDetails,
    });
  } catch (err) {
    console.error("AddProfileData error:", err);
    res
      .status(500)
      .json({ message: "Something went wrong while adding your data" });
  }
};

module.exports.FetchProfile = async (req, res) => {
  try {
    let id = req.user.id;
    let restaurantDetails = await restaurantSettingModel
      .findOne({
        restaurant: id,
      })
      .populate("restaurant")
      .lean()
      .exec();
    if (!restaurantDetails)
      return res.status(501).json({
        success: false,
        message: "No Data Found for the restuarant",
      });
    res.status(200).json({
      success: true,
      message: "Fetched the data succesfully",
      data: restaurantDetails,
    });
  } catch (err) {
    console.error(
      "Something went wrong while fetching the Restaurant Details",
      err
    );
    res.status(500).json({
      message: "Something went wrong while fetching the Restaurant Details",
      error: err,
    });
  }
};
