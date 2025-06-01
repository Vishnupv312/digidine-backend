// Category Model
const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RestaurantModel",
    required: true,
  },
  order: {
    type: Number,
    default: 0,
    unique: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Category", categorySchema);
