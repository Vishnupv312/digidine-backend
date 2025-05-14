const mongoose = require("mongoose");

const restaurantSchma = mongoose.Schema({
  name: {
    type: String,
  },
  slug: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: { type: String, required: true },
  phone: String,
  address: String,
  description: String,
  logoUrl: String,
  theme: {
    type: String,
    default: "classic",
  },
  // menuItems: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "MenuItem",
  //   },
  // ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("RestaurantModel", restaurantSchma);
