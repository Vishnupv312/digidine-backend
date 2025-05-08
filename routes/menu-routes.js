const express = require("express");
const { verifyToken } = require("../middlewares/auth-middleware");
const {
  CreateCategory,
  ReadCategory,
  UpdateCategory,
  DeleteCategory,
} = require("../controllers/menu-controler");
const router = express.Router();

router.post("/add-category", verifyToken, CreateCategory);
router.get("/fetch-categories", verifyToken, ReadCategory);
router.post("/update-category", verifyToken, UpdateCategory);
router.delete("/delete-category", verifyToken, DeleteCategory);
module.exports = router;
