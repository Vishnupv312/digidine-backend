const razorpayInstance = require("../utils/razorpay");
const paymentSchema = require("../models/payment-subscription-model");
const crypto = require("crypto");

module.exports.FetchPlans = async (req, res) => {
  try {
    const subs = await razorpayInstance.plans.all();
    console.log(subs);
    res.status(200).json(subs);
  } catch (err) {
    console.log("failed to fetch the plans ", err);
    res.status(401).json({ message: "Failed to fetch the Plans", error: err });
  }
};

module.exports.CreateSubscription = async (req, res) => {
  try {
    let plan_id = req.body.plan_id;
    const fiveMinutesLater = Math.floor(Date.now() / 1000) + 5 * 60;

    const createSubscription = await razorpayInstance.subscriptions.create({
      plan_id,
      start_at: fiveMinutesLater, //time seconds me hai 5 min zyada from current
      customer_notify: true,
      total_count: 12,
      quantity: 1,
    });

    res.status(200).json({
      subscription_id: createSubscription.id,
      key: process.env.API_KEY_ID, // This is safe to expose});
    });
  } catch (err) {
    res
      .status(502)
      .json({ message: "Failed to create the subscription ", err });
    console.log(err);
  }
};

module.exports.HandlePaymentResponse = async (req, res) => {
  let { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } =
    req.body;

  const secret = process.env.API_KEY_SECRET;
  console.log(
    razorpay_payment_id,
    razorpay_signature,
    razorpay_subscription_id
  );

  if (
    !razorpay_payment_id ||
    !razorpay_signature ||
    !razorpay_subscription_id
  ) {
    function hmac_sha256(data, secret) {
      return crypto.createHmac("sha256", secret).update(data).digest("hex");
    }

    razorpay_subscription_id + "|" + razorpay_payment_id, secret;

    if (generated_signature == razorpay_signature) {
      let subscriptionDetails = razorpayInstance.subscriptions.fetch(
        razorpay_subscription_id
      );
      if (subscriptionDetails) {
        const saveSubResponse = await paymentSchema.create({
          resturantId: req.user.id,
          razorpay_payment_id,
          razorpay_subscription_id,
          status: subscriptionDetails.status,
        });
        if (saveSubResponse) {
          res.status(200).json({ message: "success", data: saveSubResponse });
        }
      } else {
        console.trace(res);
        res.status(403).json({
          message: "Subscription could not be found ",
          data: res.error.code,
        });
      }
    } else {
      console.trace(err);
      res.status(404).json("Not authenticated ");
    }
  } else {
    res.status(400).josn({ message: "Payment signature not recieved " });
  }
};
