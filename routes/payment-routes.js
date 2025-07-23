const express = require("express");
const router = express.Router();
const {
  FetchPlans,
  CreateSubscription,
  HandlePaymentResponse,
  UpgradeSubscription,
  fetchSubscription,
  viewInvoice,
  downloadInvoice,
} = require("../controllers/payment-controller");
const { verifyToken } = require("../middlewares/auth-middleware");

router.get("/fetch-plans", verifyToken, FetchPlans);
router.post("/create-subscription", verifyToken, CreateSubscription);
router.post("/payment-response", verifyToken, HandlePaymentResponse);
router.post("/upgrade-plan", verifyToken, UpgradeSubscription);
router.get("/fetch-subscription-details", verifyToken, fetchSubscription);
router.get("/invoice/view/:invoice_id", verifyToken, viewInvoice);

router.get("/invoice/:invoice_id", verifyToken, downloadInvoice);

module.exports = router;
