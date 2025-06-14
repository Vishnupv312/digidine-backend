const express = require("express");
const router = express.Router();
const {
  FetchPlans,
  CreateSubscription,
} = require("../controllers/payment-controller");
const { verifyToken } = require("../middlewares/auth-middleware");

router.get("/fetch-plans", verifyToken, FetchPlans);
router.post("/create-subscription", verifyToken, CreateSubscription);

module.exports = router;
