const razorpayInstance = require("../utils/razorpay");
const paymentSchema = require("../models/payment-subscription-model");
const crypto = require("crypto");
const restaurantModel = require("../models/restaurant-model");
const paymentSubscriptionModel = require("../models/payment-subscription-model");

function verifySubscriptionSignature(
  subscription_id,
  payment_id,
  razorpay_signature,
  secret
) {
  const body = payment_id + "|" + subscription_id;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex");

  return expectedSignature === razorpay_signature;
}

module.exports.FetchPlans = async (req, res) => {
  try {
    const subs = await razorpayInstance.plans.all();

    res.status(200).json(subs);
  } catch (err) {
    console.log("failed to fetch the plans ", err);
    res.status(401).json({ message: "Failed to fetch the Plans", error: err });
  }
};

module.exports.CreateSubscription = async (req, res) => {
  try {
    let { plan_id } = req.body;
    if (plan_id === "")
      return res.status(404).json({ message: "plan id is required " });

    //create the customerId if not exists then
    const userData = await restaurantModel.findById(req.user.id);
    if (!userData) return res.status(405).json({ message: "user not found " });

    const notes = {
      billingStreet: userData.billingAddress.street,
      billingCity: userData.billingAddress.city,
      billingState: userData.billingAddress.state,
      billingZipCode: String(userData.billingAddress.zipCode),
      billingCountry: userData.billingAddress.country || "INDIA",
    };

    const customer = await razorpayInstance.customers.create({
      name: userData.ownerName,
      email: userData.email,
      phone: userData.phone,
      fail_existing: "0",
      notes: notes,
    });

    if (!customer) {
      console.trace(customer);
      return res.status(500).json({
        message: "internal server error please try again",
        error: customer,
      });
    }

    const updatedUser = await restaurantModel.findByIdAndUpdate(req.user.id, {
      $set: { razorpayCustomerId: customer.id },
    });

    if (!updatedUser)
      return res.status(402).json({
        message:
          "Couldn't Update the customer Id for payment please try Again ",
      });
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
  const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } =
    req.body;

  // Check if any field is missing or empty
  if (
    !razorpay_payment_id?.trim() ||
    !razorpay_signature?.trim() ||
    !razorpay_subscription_id?.trim()
  ) {
    return res
      .status(400)
      .json({ message: "Missing or empty payment details." });
  }

  try {
    const isValid = verifySubscriptionSignature(
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
      process.env.API_KEY_SECRET
    );

    if (!isValid) {
      return res.status(403).json({ message: "Invalid signature." });
    }

    const subscriptionDetails = await razorpayInstance.subscriptions.fetch(
      razorpay_subscription_id
    );

    if (!subscriptionDetails) {
      return res.status(404).json({ message: "Subscription not found." });
    }

    const saveSubResponse = await paymentSchema.create({
      restaurantId: req.user.id,
      razorpay_payment_id,
      razorpay_subscription_id,
      status: subscriptionDetails.status,
    });
    if (!saveSubResponse) {
      return res.status(405).json({ message: "Response could not be saved " });
    }

    return res.status(200).json({ message: "success", data: saveSubResponse });
  } catch (err) {
    console.error("Error in HandlePaymentResponse:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

module.exports.UpgradeSubscription = async (req, res) => {
  //flow will be 1st cancel currennt subscription
  //create new subscription

  try {
    let id = req.user.id;
    const subscriptionData = await paymentSubscriptionModel.findOne({
      restaurantId: id,
    });
    if (!restaurantData) {
      return res.status(405).json({
        message:
          "Could not find any Subscription matching you ID please try again ",
      });
    }

    let cancelSubscription = await razorpayInstance.subscriptions.cancel(
      subscriptionData.razorpay_subscription_id
    );
    if (!cancelSubscription) {
      return res.status(405).json({
        message: "Could not cancel your current subscription please try again ",
        error: cancelSubscription,
      });
    }

    const updatedSubscriptionState = await paymentSubscriptionModel.updateOne(
      { restaurantId: id },
      { $set: { status: "cancelled" } }
    );
    if (!updatedSubscriptionState)
      return res
        .status(406)
        .json({ message: "couldnt update the subscripiton status " });

    const fiveMinutesLater = Math.floor(Date.now() / 1000) + 5 * 60;

    const newSubscription = await razorpayInstance.subscriptions.create({
      plan_id,
      start_at: fiveMinutesLater, //time seconds me hai 5 min zyada from current
      customer_notify: true,
      total_count: 12,
      quantity: 1,
    });

    res.status(200).json({
      subscription_id: newSubscription.id,
      key: process.env.API_KEY_ID, // This is safe to expose});
    });
  } catch (err) {}
};

module.exports.fetchSubscription = async (req, res) => {
  //fetch susbscription by id
  try {
    let sub_id = req.query.sub_id;
    if (!sub_id) {
      return res.status(405).json({ message: "Subscription id is required " });
    }
    let subData = await razorpayInstance.subscriptions.fetch(sub_id);
    if (subData) {
      let data = {
        id: subData.id,
        plan_id: subData.plan_id,
        customer_id: subData.customer_id,
        status: subData.status,
        total_count: subData.total_count,
        paid_count: subData.paid_count,
      };
      res.status(200).json({
        message: "Fetched the subscription details successfully ",
        data,
      });
    }
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ message: "Something went wrong please try again ", error: err });
  }

  //provide that status data to rontend based on that render the button "upgrade-now or active
};
