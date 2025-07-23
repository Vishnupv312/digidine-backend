const razorpayInstance = require("../utils/razorpay");
const paymentSchema = require("../models/payment-subscription-model");
const crypto = require("crypto");
const restaurantModel = require("../models/restaurant-model");
const paymentSubscriptionModel = require("../models/payment-subscription-model");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

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

    // Use upsert (update or insert) instead of create
    const saveSubResponse = await paymentSchema.findOneAndUpdate(
      { restaurantId: req.user.id, razorpay_subscription_id },
      {
        restaurantId: req.user.id,
        razorpay_payment_id,
        razorpay_subscription_id,
        status: subscriptionDetails.status,
        createdAt: new Date(),
      },
      {
        upsert: true, // Create if doesn't exist
        new: true, // Return updated document
      }
    );

    return res.status(200).json({ message: "success", data: saveSubResponse });
  } catch (err) {
    console.error("Error in HandlePaymentResponse:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
      err,
    });
  }
};

module.exports.UpgradeSubscription = async (req, res) => {
  //flow will be 1st cancel current subscription
  //create new subscription

  try {
    let { plan_id } = req.body;
    let id = req.user.id;
    const subscriptionData = await paymentSubscriptionModel.findOne({
      restaurantId: id,
    });
    console.log(subscriptionData);
    if (!subscriptionData) {
      return res.status(405).json({
        message:
          "Could not find any Subscription matching you ID please try again ",
      });
    }

    // Check if subscription is not already cancelled
    if (subscriptionData.status !== "cancelled") {
      let cancelSubscription = await razorpayInstance.subscriptions.cancel(
        subscriptionData.razorpay_subscription_id
      );

      console.log(cancelSubscription);

      if (!cancelSubscription) {
        return res.status(405).json({
          message:
            "Could not cancel your current subscription please try again ",
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
          .json({ message: "couldnt update the subscription status " });
    }

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
      key: process.env.API_KEY_ID, // This is safe to expose
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "something went wrong while upgrading your plan",
      error: err.message,
      err,
    });
  }
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

async function generateInvoicePDF(
  invoiceData,
  subscriptionData,
  restaurantData
) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      // Invoice Header
      doc
        .fillColor("#444444")
        .fontSize(20)
        .text("DigiDine", 50, 50)
        .fontSize(10)
        .text("123 Restaurant Street", 50, 70)
        .text("Food City, FC 12345", 50, 85)
        .text(`Invoice #: ${invoiceData.id}`, 50, 100)
        .text(
          `Date: ${new Date(invoiceData.date * 1000).toLocaleDateString()}`,
          50,
          115
        )
        .moveDown();

      // Customer Information
      doc
        .text(`Bill To:`, 300, 70)
        .text(restaurantData.restaurantName, 300, 85)
        .text(restaurantData.ownerName, 300, 100)
        .text(restaurantData.billingAddress.street, 300, 115)
        .text(
          `${restaurantData.billingAddress.city}, ${restaurantData.billingAddress.state} ${restaurantData.billingAddress.zipCode}`,
          300,
          130
        )
        .moveDown();

      // Invoice Title
      doc.fontSize(16).text("Invoice", 50, 160).moveDown();

      // Invoice Table Header
      const tableTop = 200;
      doc
        .fontSize(10)
        .text("Description", 50, tableTop)
        .text("Amount", 350, tableTop, { width: 100, align: "right" });

      // Invoice Items
      const itemTop = tableTop + 25;
      doc
        .fontSize(10)
        .text(subscriptionData.plan_id, 50, itemTop)
        .text(`₹${(invoiceData.amount / 100).toFixed(2)}`, 350, itemTop, {
          width: 100,
          align: "right",
        });

      // Total
      const totalTop = itemTop + 30;
      doc
        .fontSize(12)
        .text("Total", 300, totalTop)
        .text(`₹${(invoiceData.amount / 100).toFixed(2)}`, 350, totalTop, {
          width: 100,
          align: "right",
        });

      // Footer
      doc
        .fontSize(8)
        .text("Thank you for your business!", 50, 700, { align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Update the downloadInvoice function
module.exports.downloadInvoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    if (!invoice_id) {
      return res.status(400).json({ message: "Invoice ID is required" });
    }

    // Fetch invoice details from Razorpay
    const invoice = await razorpayInstance.invoices.fetch(invoice_id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Fetch subscription details
    const subscription = await razorpayInstance.subscriptions.fetch(
      invoice.subscription_id
    );

    // Fetch restaurant details
    const restaurant = await restaurantModel.findById(req.user.id);

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(
      invoice,
      subscription,
      restaurant
    );

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${invoice.id}.pdf`
    );

    // Send the PDF
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generating invoice:", err);
    res.status(500).json({
      message: "Failed to generate invoice",
      error: err.message,
    });
  }
};

// Add a new function to view invoice
module.exports.viewInvoice = async (req, res) => {
  try {
    const { invoice_id } = req.params;

    if (!invoice_id) {
      return res.status(400).json({ message: "Invoice ID is required" });
    }

    // Fetch invoice details from Razorpay
    const invoice = await razorpayInstance.invoices.fetch(invoice_id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Fetch subscription details
    const subscription = await razorpayInstance.subscriptions.fetch(
      invoice.subscription_id
    );

    // Fetch restaurant details
    const restaurant = await restaurantModel.findById(req.user.id);

    // Generate HTML for invoice view
    const invoiceData = {
      id: invoice.id,
      date: new Date(invoice.date * 1000).toLocaleDateString(),
      amount: (invoice.amount / 100).toFixed(2),
      plan: subscription.plan_id,
      restaurant: {
        name: restaurant.restaurantName,
        owner: restaurant.ownerName,
        address: `${restaurant.billingAddress.street}, ${restaurant.billingAddress.city}, ${restaurant.billingAddress.state} ${restaurant.billingAddress.zipCode}`,
      },
    };

    res.status(200).json({
      message: "Invoice fetched successfully",
      invoice: invoiceData,
    });
  } catch (err) {
    console.error("Error fetching invoice:", err);
    res.status(500).json({
      message: "Failed to fetch invoice",
      error: err.message,
    });
  }
};
