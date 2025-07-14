const Razorpay = require("razorpay");

var razorpayInstance = new Razorpay({
  key_id: process.env.API_KEY_ID,
  key_secret: process.env.API_KEY_SECRET,
});

module.exports = razorpayInstance;
