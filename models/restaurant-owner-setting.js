const mongoose = require("mongoose");
const restaurantModel = require("./restaurant-model");

const restaurantOwnerSetting = mongoose.Schema({
  restaurantId: {
    type: mongoose.Types.ObjectId,
    ref: restaurantModel,
    required: true,
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
  openingHours: {
    type: Array,
  },
});

module.exports = mongoose.model("restaurantOwnerModel", restaurantOwnerSetting);
