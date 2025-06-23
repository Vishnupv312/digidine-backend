const mongoose = require("mongoose");
const restaurantModel = require("./restaurant-model");

const paymentSchema = mongoose.Schema({
  restaurantId: {
    type: mongoose.Types.ObjectId,
    ref: restaurantModel,
    require: true,
  },
  razorpay_payment_id: {
    type: String,
    require: true,
    unique: true,
  },
  razorpay_subscription_id: {
    type: String,
    require: true,
    unique: true,
  },
  razorpayPlanId: {
    type: String,
    require: true,
    unique: true,
  },
  amount: Number,
  currency: String,
  status: String,
  invoiceId: String,
  paymentMethod: String,
  createdAt: Date,
});

module.exports = mongoose.model("PaymentModel", paymentSchema);
