const RestaurantOwnerSetting = require("../models/restaurant-setting.model");
const express = require("express");
const { uploadImage } = require("../config/cloudinary");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

module.exports.AddProfileData = async (req, res) => {
  const id = req.user.id;
  try {
    console.log("=== START DEBUG ===");
    console.log("User ID:", id);
    console.log("req.body exists:", !!req.body);
    console.log("req.body:", req.body);
    console.log("req.files exists:", !!req.files);
    console.log("req.files:", req.files);

    if (!req.body) {
      console.error("req.body is null or undefined");
      return res.status(400).json({
        success: false,
        message:
          "No data received. Make sure you're sending form data correctly.",
      });
    }

    const body = req.body;
    console.log("Request body keys:", Object.keys(body));

    const {
      restaurantName,
      theme = "classic",
      website,
      address,
      description,
      openingHours,
    } = body;

    console.log("Extracted fields:", {
      restaurantName,
      theme,
      website,
      address,
      description,
      openingHours: openingHours ? "present" : "missing",
    });

    // Process file uploads
    let restaurantLogoPath, restaurantBannerPath;

    if (req.files?.restaurantLogo) {
      restaurantLogoPath = `/uploads/user/user-settings/${req.files.restaurantLogo[0].filename}`;
      console.log("Logo path:", restaurantLogoPath);
    }

    if (req.files?.restaurantBannerImage) {
      restaurantBannerPath = `/uploads/user/user-settings/${req.files.restaurantBannerImage[0].filename}`;
      console.log("Banner path:", restaurantBannerPath);
    }

    // Prepare update data
    const updateData = {};

    // Handle basic fields - check for both undefined and empty string
    if (restaurantName?.trim()) {
      updateData.restaurantName = restaurantName.trim();
    }
    if (theme?.trim()) {
      updateData.theme = theme.trim();
    }
    if (website?.trim()) {
      updateData.website = website.trim();
    }
    if (address?.trim()) {
      updateData.address = address.trim();
    }
    if (description?.trim()) {
      updateData.description = description.trim();
    }
    if (restaurantLogoPath) {
      updateData.restaurantLogo = restaurantLogoPath;
    }
    if (restaurantBannerPath) {
      updateData.restaurantBannerImage = restaurantBannerPath;
    }

    // Handle opening hours
    console.log("=== OPENING HOURS PROCESSING ===");
    if (openingHours) {
      try {
        let parsedHours =
          typeof openingHours === "string"
            ? JSON.parse(openingHours)
            : openingHours;

        if (Array.isArray(parsedHours)) {
          const processedHours = parsedHours
            .map((hour) => ({
              day: hour.day?.toString().trim() || "",
              open: hour.open?.toString().trim() || "",
              close: hour.close?.toString().trim() || "",
            }))
            .filter((hour) => hour.day); // Remove entries with empty day

          console.log("Processed opening hours:", processedHours);
          updateData.openingHours = processedHours;
        } else {
          console.error("openingHours is not an array after parsing");
        }
      } catch (e) {
        console.error("Error parsing openingHours:", e.message);
        return res.status(400).json({
          success: false,
          message: "Invalid openingHours format",
          error: e.message,
        });
      }
    }

    console.log("=== FINAL UPDATE DATA ===");
    console.log(JSON.stringify(updateData, null, 2));

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid data provided for update",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant ID format",
      });
    }

    console.log("Performing database update...");
    const restaurantDetails = await RestaurantOwnerSetting.findOneAndUpdate(
      { restaurantId: id },
      { $set: updateData },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    console.log("Update successful. Result:", restaurantDetails);

    res.status(200).json({
      success: true,
      message: "Profile data updated successfully",
      data: restaurantDetails,
    });
  } catch (err) {
    console.error("AddProfileData error:", err.message);
    console.error("Error stack:", err.stack);

    // Clean up uploaded files if error occurred
    if (req.files?.restaurantLogo) {
      const fullPath = path.join(__dirname, "../public", restaurantLogoPath);
      fs.unlink(fullPath, () => {
        console.log(`Cleaned up file: ${fullPath}`);
      });
    }
    if (req.files?.restaurantBannerImage) {
      const fullPath = path.join(__dirname, "../public", restaurantBannerPath);
      fs.unlink(fullPath, () => {
        console.log(`Cleaned up file: ${fullPath}`);
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

module.exports.FetchProfile = async (req, res) => {
  try {
    const id = req.user.id;
    console.log("Fetching profile for user ID:", id);

    const restaurantDetails = await RestaurantOwnerSetting.findOne({
      restaurantId: id,
    })
      .populate("restaurantId")
      .lean()
      .exec();

    console.log("Found restaurant details:", restaurantDetails);

    if (!restaurantDetails) {
      return res.status(404).json({
        success: false,
        message: "No data found for the restaurant",
      });
    }

    res.status(200).json({
      success: true,
      message: "Fetched the data successfully",
      data: restaurantDetails,
    });
  } catch (err) {
    console.error("FetchProfile error:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the Restaurant Details",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
