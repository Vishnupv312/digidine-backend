const mongoose = require("mongoose");
const restaurantModel = require("./restaurant-model");

const restaurantOwnerSetting = mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Types.ObjectId,
      ref: "RestaurantModel", // Use string reference instead of direct model
      required: true,
    },
    restaurantName: {
      type: String,
    },
    restaurantLogo: {
      type: String,
    },
    theme: {
      type: String,
      default: "classic",
    },
    restaurantBannerImage: {
      type: String,
    },
    restaurantAddress: {
      // Keep this field name
      type: String,
    },
    website: {
      type: String,
    },
    description: {
      type: String,
    },
    address: {
      // Or remove this duplicate field
      type: String,
    },
    openingHours: [
      {
        day: {
          type: String,
        },
        open: {
          type: String, // e.g., "09:00"
        },
        close: {
          type: String, // e.g., "21:00"
        },
      },
    ],
  },
  {
    timestamps: true, // This will automatically add createdAt and updatedAt
  }
);

restaurantOwnerSetting.index({ restaurantId: 1 });

module.exports = mongoose.model(
  "RestaurantOwnerSetting",
  restaurantOwnerSetting
);
