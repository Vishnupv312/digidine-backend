const razorpayInstance = require("../utils/razorpay");

module.exports.FetchPlans = async (req, res) => {
  try {
    const subs = await razorpayInstance.plans.all();
    res.status(200).json(subs);
  } catch (err) {
    console.log("failed to fetch the plans ", err);
    res.status(501).json({ message: "Failed to fetch the Plans", error: err });
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

    res.status(200).json(createSubscription);
  } catch (err) {
    res
      .status(502)
      .json({ message: "Failed to create the subscription ", err });
    console.log(err);
  }
};
