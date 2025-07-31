// models/qr-code-model.js
const mongoose = require("mongoose");

const qrCodeSchema = new mongoose.Schema(
  {
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
      required: true, // Cloudinary URL
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
      default: "#205781", // Updated default to match UI
    },
    backgroundColor: {
      type: String,
      default: "#ffffff",
    },
    theme: {
      type: String,
      enum: ["classic", "modern", "elegant"],
      default: "classic",
    },
    size: {
      type: Number,
      default: 300, // Default size in pixels
    },
    cornerRadius: {
      type: Number,
      default: 0, // Default corner radius
    },
    lastScanned: {
      type: Date,
      default: null, // Will be updated on each scan
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for faster queries
qrCodeSchema.index({ restaurant: 1 });
qrCodeSchema.index({ slugUrl: 1 });
qrCodeSchema.index({ createdAt: -1 });

// Virtual property for the full menu URL
qrCodeSchema.virtual("menuUrl").get(function () {
  return `${process.env.FRONTEND_URI}menu/${this.slugUrl}`;
});

// Method to increment scan count
qrCodeSchema.methods.incrementScanCount = async function () {
  this.scanCount += 1;
  this.lastScanned = new Date();
  await this.save();
  return this.scanCount;
};

qrCodeSchema.statics.updateTheme = async function (
  qrCodeId,
  newTheme,
  foregroundColor,
  backgroundColor
) {
  const qrCode = await this.findById(qrCodeId);
  if (!qrCode) {
    throw new Error("QR Code not found");
  }

  qrCode.theme = newTheme;
  if (foregroundColor) qrCode.foregroundColor = foregroundColor;
  if (backgroundColor) qrCode.backgroundColor = backgroundColor;

  await qrCode.save();
  return qrCode;
};

module.exports = mongoose.model("QRCodeModel", qrCodeSchema);
