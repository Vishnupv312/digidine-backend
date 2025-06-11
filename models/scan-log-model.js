// models/scan-log-model.js
const mongoose = require("mongoose");

const scanLogSchema = new mongoose.Schema({
  qrCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QRCode",
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RestaurantModel",
    required: true,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  scannedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ScanLog", scanLogSchema);
