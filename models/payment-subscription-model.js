const mongoose = require("mongoose");
const restaurantModel = require("./restaurant-model");

const paymentSchema = mongoose.Schema({
  restaurantId: {
    type: mongoose.Types.ObjectId,
    ref: restaurantModel,
    require: true,
  },
  razorpayPaymentId: String,
  razorpaySubscriptionId: String,
  amount: Number,
  currency: String,
  status: String,
  invoiceId: String,
  paymentMethod: String,
  createdAt: Date,
});
