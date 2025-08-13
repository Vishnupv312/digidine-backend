const { default: mongoose } = require("mongoose");
const RestaurantModel = require("../models/restaurant-model");

module.exports.UpdateOwnerData = async (req, res) => {
  let { ownerName, phone, billingAddress } = req.body;

  try {
    const updateFields = {};

    if (ownerName) updateFields.ownerName = ownerName;
    if (phone) updateFields.phone = phone;

    // Handle billing address fields
    if (billingAddress.street)
      updateFields["billingAddress.street"] = billingAddress.street;
    if (billingAddress.city)
      updateFields["billingAddress.city"] = billingAddress.city || " ";
    if (billingAddress.state)
      updateFields["billingAddress.state"] = billingAddress.state || "";
    if (billingAddress.zipCode)
      updateFields["billingAddress.zipCode"] = billingAddress.zipCode;
    if (billingAddress.country)
      updateFields["billingAddress.country"] = billingAddress.country;

    console.log("Update fields:", updateFields); // Debug log
    console.log("User ID:", req.user.id); // Debug log

    const updatedUser = await RestaurantModel.findOneAndUpdate(
      { _id: req.user.id },
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
        upsert: false,
      }
    );

    console.log("Updated user:", updatedUser); // Debug log

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found with the provided ID",
        success: false,
      });
    }

    res.status(200).json({
      message: "User updated successfully",
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      message: "Error updating user",
      success: false,
      error: error.message,
    });
  }
};
