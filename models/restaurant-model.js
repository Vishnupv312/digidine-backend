const mongoose = require("mongoose");

const restaurantSchma = mongoose.Schema({
  restaurantName: {
    type: String,
    required: true,
  },
  ownerName: { type: String, required: true },
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
  authProvider: {
    type: String,
    enum: ["local", "google"],
    required: true,
  },
  address: String,
  description: String,
  logoUrl: String,
  theme: {
    type: String,
    default: "classic",
  },
  ownerProfileImage: {
    type: String,
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: Number,
    country: { type: String, default: "INDIA" },
  },
  razorpayCustomerId: { type: String },
  subscription: [
    // {
    //   razorpaySubscriptionId: String,
    //   planId: String,
    //   status: String, // active, pending, cancelled, etc.
    //   currentStart: Date,
    //   currentEnd: Date,
    //   paymentMethod: String,
    // },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

restaurantSchma.virtual("subscriptions", {
  ref: "PaymentModel",
  localField: "_id", // matches restaurantId in PaymentModel
  foreignField: "restaurantId",
});

restaurantSchma.set("toObject", { virtuals: true });
restaurantSchma.set("toJSON", { virtuals: true });
module.exports = mongoose.model("RestaurantModel", restaurantSchma);
