const express = require("express");
const router = express.Router();
const validateWebhookSignature = require("razorpay").validateWebhookSignature;

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let webhook_secret = process.env.RAZARPAY_WEBHOOK_SECRET;
    let webhookSignature = req.headers["x-razorpay-signature"];

    try {
      console.log("webhook body response ", req.body);
      let isValid = validateWebhookSignature(
        req.body,
        webhookSignature,
        webhook_secret
      );
      console.log(isValid);
      res.status(200).send("webhook recieved");
    } catch (err) {
      console.log(err);
    }
  }
);

module.exports = router;
