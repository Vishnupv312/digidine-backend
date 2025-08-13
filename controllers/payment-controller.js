const razorpayInstance = require("../utils/razorpay");
const paymentSchema = require("../models/payment-subscription-model");
const crypto = require("crypto");
const restaurantModel = require("../models/restaurant-model");
const paymentSubscriptionModel = require("../models/payment-subscription-model");
const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");
// const easyInvoice = require("easyinvoice");

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
  const generateShortId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };
  const InvoiceId = `INV-${generateShortId()}`;
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
        invoiceId: InvoiceId,
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
  try {
    const { plan_id } = req.body;
    const id = req.user.id;

    const subscriptionData = await paymentSubscriptionModel.find({
      restaurantId: id,
    });

    if (!subscriptionData || subscriptionData.length === 0) {
      return res.status(405).json({
        message: "No subscriptions found for your account. Please try again.",
      });
    }

    for (const subscription of subscriptionData) {
      if (subscription.status !== "cancelled") {
        if (!subscription.razorpay_subscription_id) {
          console.error("Missing subscription ID");
          continue;
        }

        const cancelSubscription = await razorpayInstance.subscriptions.cancel(
          subscription.razorpay_subscription_id
        );

        if (!cancelSubscription) {
          return res.status(405).json({
            message:
              "Could not cancel your current subscription. Please try again.",
            error: cancelSubscription,
          });
        }

        const updatedSubscriptionState =
          await paymentSubscriptionModel.updateOne(
            {
              restaurantId: id,
              razorpay_subscription_id: subscription.razorpay_subscription_id,
            },
            { $set: { status: "cancelled" } }
          );

        if (!updatedSubscriptionState) {
          return res.status(406).json({
            message: "Could not update the subscription status.",
          });
        }
      }
    }

    const fiveMinutesLater = Math.floor(Date.now() / 1000) + 5 * 60;

    const newSubscription = await razorpayInstance.subscriptions.create({
      plan_id,
      start_at: fiveMinutesLater,
      customer_notify: true,
      total_count: 12,
      quantity: 1,
    });

    return res.status(200).json({
      subscription_id: newSubscription.id,
      key: process.env.API_KEY_ID,
    });
  } catch (err) {
    console.error("UpgradeSubscription error:", err);
    return res.status(500).json({
      message: "Something went wrong while upgrading your plan.",
      error: err.message,
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

// Update the downloadInvoice function
module.exports.downloadInvoice = async (req, res) => {
  try {
    let subscription_id = req.query.sub_id;
    if (!subscription_id)
      return res.status(406).json({
        message: "Subscription id is required to generate the Invoice",
      });

    let subscriptionData = await razorpayInstance.subscriptions.fetch(
      subscription_id
    );
    let userData = await restaurantModel.findById(req.user.id);
    let paymentData = await paymentSubscriptionModel.findOne({
      razorpay_subscription_id: subscription_id,
    });

    // Fetch plan details to get pricing and plan name
    let planData = await razorpayInstance.plans.fetch(subscriptionData.plan_id);

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    // Convert timestamps to readable dates
    const startDate = new Date(subscriptionData.start_at * 1000)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(subscriptionData.end_at * 1000)
      .toISOString()
      .split("T")[0];

    // Get plan details from the correct structure
    const planName = planData.item.name;
    const planAmount = planData.item.amount / 100;
    const planPeriod = `${planData.interval} ${planData.period}`;
    const taxRate = 18;

    // Calculate totals
    const subtotal = planAmount * subscriptionData.quantity;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // Generate PDF using PDFKit
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice-${
          paymentData?.invoiceId || "default"
        }.pdf`
      );
      res.send(pdfData);
    });

    // Header - Invoice Title
    doc.fontSize(24).fillColor("#2c3e50").text("INVOICE", 50, 50);

    // Invoice Details (Top Right)
    doc
      .fontSize(12)
      .fillColor("#000")
      .text(`Invoice Number: ${paymentData?.invoiceId || "N/A"}`, 350, 50)
      .text(`Date: ${formattedDate}`, 350, 70)
      .text(`Due Date: ${endDate}`, 350, 90);

    // Company Logo area (if needed)
    // doc.image('logo.png', 50, 80, { width: 100 });

    // From Section
    doc.fontSize(14).fillColor("#2c3e50").text("From:", 50, 150);

    doc
      .fontSize(11)
      .fillColor("#000")
      .text("Digidine", 50, 170)
      .text("Sample Address", 50, 185)
      .text("Ahmedabad, Gujarat - 380051", 50, 200)
      .text("India", 50, 215);

    // Bill To Section
    doc.fontSize(14).fillColor("#2c3e50").text("Bill To:", 300, 150);

    doc
      .fontSize(11)
      .fillColor("#000")
      .text(userData?.restaurantName || "Restaurant Name", 300, 170)
      .text(
        userData?.billingAddress?.street || "Street not available",
        300,
        185
      )
      .text(userData?.billingAddress?.city || "City", 300, 200)
      .text(userData?.billingAddress?.country || "Country", 300, 215);

    // Line separator
    doc.moveTo(50, 250).lineTo(550, 250).strokeColor("#ddd").stroke();

    // Table Header
    // Use more padding and fix overlaps
    const tableTop = 280;
    doc
      .fontSize(12)
      .fillColor("#2c3e50")
      .text("Description", 50, tableTop)
      .text("Qty", 300, tableTop)
      .text("Price (Rs)", 340, tableTop)
      .text("Tax Rate", 400, tableTop)
      .text("Amount (Rs)", 470, tableTop);

    // Table header underline
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .strokeColor("#ddd")
      .stroke();

    // Product Row
    const productY = tableTop + 30;
    doc
      .fontSize(10)
      .fillColor("#000")
      .text(`${planName} Plan - ${planPeriod}`, 50, productY, { width: 240 })
      .text(subscriptionData.quantity.toString(), 300, productY)
      .text(planAmount.toFixed(2), 340, productY)
      .text(`${taxRate}%`, 400, productY)
      .text(totalAmount.toFixed(2), 470, productY);

    // Totals Section
    const totalsY = productY + 50;

    // Subtotal
    doc
      .fontSize(11)
      .text("Subtotal:", 400, totalsY)
      .text(`Rs ${subtotal.toFixed(2)}`, 480, totalsY);

    // Tax
    doc.text(`GST (${taxRate}%):`, 400, totalsY + 20);
    doc.text(`Rs ${taxAmount.toFixed(2)}`, 480, totalsY + 20);

    // Total line
    doc
      .moveTo(400, totalsY + 35)
      .lineTo(550, totalsY + 35)
      .strokeColor("#000")
      .stroke();

    // Total Amount
    doc
      .fontSize(12)
      .fillColor("#2c3e50")
      .text("Total Amount:", 400, totalsY + 45)
      .text(`Rs ${totalAmount.toFixed(2)}`, 480, totalsY + 45);

    // Subscription Details Section
    const subscriptionDetailsY = totalsY + 100;
    doc
      .fontSize(12)
      .fillColor("#2c3e50")
      .text("Subscription Details:", 50, subscriptionDetailsY);

    doc
      .fontSize(10)
      .fillColor("#000")
      .text(
        `Subscription ID: ${subscriptionData.id}`,
        50,
        subscriptionDetailsY + 20
      )
      .text(`Plan: ${planName}`, 50, subscriptionDetailsY + 35)
      .text(
        `Billing Period: ${startDate} to ${endDate}`,
        50,
        subscriptionDetailsY + 50
      )
      .text(
        `Payment Method: ${
          subscriptionData.payment_method?.toUpperCase() || "N/A"
        }`,
        50,
        subscriptionDetailsY + 65
      )
      .text(
        `Payments: ${subscriptionData.paid_count}/${subscriptionData.total_count} completed (${subscriptionData.remaining_count} remaining)`,
        50,
        subscriptionDetailsY + 80
      );

    // Footer
    const footerY = subscriptionDetailsY + 120;
    doc
      .fontSize(8)
      .fillColor("#666")
      .text("Thank you for your business!", 50, footerY)
      .text(
        "For any queries, please contact our support team.",
        50,
        footerY + 15
      );

    // Finalize the PDF
    doc.end();
  } catch (err) {
    console.error("Error generating invoice:", err);
    res.status(500).json({
      message: "Failed to generate invoice",
      error: err.message,
    });
  }
};

module.exports.viewInvoice = async (req, res) => {
  try {
    let subscription_id = req.query.sub_id;
    if (!subscription_id)
      return res.status(406).json({
        message: "Subscription id is required to view the Invoice",
      });

    let subscriptionData = await razorpayInstance.subscriptions.fetch(
      subscription_id
    );
    let userData = await restaurantModel.findById(req.user.id);
    let paymentData = await paymentSubscriptionModel.findOne({
      razorpay_subscription_id: subscription_id,
    });

    // Fetch plan details to get pricing and plan name
    let planData = await razorpayInstance.plans.fetch(subscriptionData.plan_id);

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    // Convert timestamps to readable dates
    const startDate = new Date(subscriptionData.start_at * 1000)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(subscriptionData.end_at * 1000)
      .toISOString()
      .split("T")[0];

    // Get plan details from the correct structure
    const planName = planData.item.name;
    const planAmount = planData.item.amount / 100;
    const planPeriod = `${planData.interval} ${planData.period}`;
    const taxRate = 18;

    // Calculate totals
    const subtotal = planAmount * subscriptionData.quantity;
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // Prepare invoice data for frontend
    const invoiceData = {
      id: paymentData?.invoiceId || "N/A",
      date: formattedDate,
      dueDate: endDate,

      // Company details
      company: {
        name: "Digidine",
        address: "Sample Address",
        city: "Ahmedabad",
        state: "Gujarat",
        zipCode: "380051",
        country: "India",
      },

      // Client details
      client: {
        company: userData?.restaurantName || "Restaurant Name",
        address: userData?.billingAddress?.street || "Address not available",
        city: userData?.billingAddress?.city || "City",
        state: userData?.billingAddress?.state || "State",
        country: userData?.billingAddress?.country || "Country",
        zipCode: userData?.billingAddress?.zipCode || "N/A",
      },

      // Plan details
      plan: {
        name: planName,
        description: `${planName} Plan - ${planPeriod}`,
        quantity: subscriptionData.quantity,
        unitPrice: planAmount,
        subtotal: subtotal,
        taxRate: taxRate,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
      },

      // Subscription details
      subscription: {
        id: subscriptionData.id,
        status: subscriptionData.status,
        startDate: startDate,
        endDate: endDate,
        paymentMethod: subscriptionData.payment_method?.toUpperCase() || "N/A",
        paidCount: subscriptionData.paid_count,
        totalCount: subscriptionData.total_count,
        remainingCount: subscriptionData.remaining_count,
      },
    };

    res.status(200).json({
      success: true,
      message: "Invoice data retrieved successfully",
      invoice: invoiceData,
    });
  } catch (err) {
    console.error("Error viewing invoice:", err);
    res.status(500).json({
      message: "Failed to retrieve invoice data",
      error: err.message,
    });
  }
};
// Add a new function to view invoice
