// models/qr-code-model.js
const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RestaurantModel",
    required: true,
  },
  type: {
    type: String,
    default: "menu", // for future use: menu, offer, event, etc.
  },
  slugUrl: {
    type: String,
    required: true, // e.g., /menu/restaurant-slug
  },
  qrImageUrl: {
    type: String,
    required: true, // Base64 or Cloudinary URL
  },
  scanCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  foregroundColor: {
    type: String,
    default: "#0000ff",
  },
  backgroundColor: {
    type: String,
    default: "#ffffff",
  },
});

module.exports = mongoose.model("QRCode", qrCodeSchema);
