const mongoose = require("mongoose");
const restaurantModel = require("./restaurant-model");

const restaurantOwnerSetting = mongoose.Schema({
  restaurantId: {
    type: mongoose.Types.ObjectId,
    ref: restaurantModel,
    required: true,
  },
  restaurantName: { type: String },
  restaurantLogo: {
    type: String,
  },
  theme: {
    type: String,
  },
  restaurantBannerImage: { type: String },
  restaurantAddress: {
    type: String,
  },
  website: {
    type: String,
  },
  description: {
    type: String,
  },
  address: {
    type: String,
  },

  openingHours: [
    {
      day: {
        type: String,
        required: true,
      },
      open: {
        type: String, // e.g., "09:00"
        required: true,
      },
      close: {
        type: String, // e.g., "21:00"
        required: true,
      },
    },
  ],
});

restaurantOwnerSetting.index({ restaurantId: 1 });

module.exports = mongoose.model("restaurantOwnerModel", restaurantOwnerSetting);
