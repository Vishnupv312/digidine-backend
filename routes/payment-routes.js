const express = require("express");
const router = express.Router();
const {
  FetchPlans,
  CreateSubscription,
  HandlePaymentResponse,
} = require("../controllers/payment-controller");
const { verifyToken } = require("../middlewares/auth-middleware");
const { verify } = require("jsonwebtoken");

router.get("/fetch-plans", verifyToken, FetchPlans);
router.post("/create-subscription", verifyToken, CreateSubscription);
router.post("/payment-response", verifyToken, HandlePaymentResponse);
module.exports = router;
