const { default: mongoose } = require("mongoose");
const RestaurantModel = require("../models/restaurant-model");

module.exports.UpdateOwnerData = async (req, res) => {
  let { ownerName, phone, street, city, state, zipcode, country } = req.body;
  let billingAddress = { street, city, state, zipcode, country };

  const updatedUser = await RestaurantModel.findByIdAndUpdate(
    req.user.id,

    { $set: { ownerName, billingAddress, phone } },
    { new: true }
  );

  if (!updatedUser)
    return res.status(403).json({
      message: "Could not update the user please try again",
      error: updatedUser,
    });

  res.status(200).json({ message: "User updated successfully" });
};
