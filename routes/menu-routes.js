const express = require("express");
const { verifyToken } = require("../middlewares/auth-middleware");
const {
  CreateCategory,
  ReadCategory,
  UpdateCategory,
  DeleteCategory,
  AddFoodItem,
  ReadFoodItem,
  UpdateFoodItem,
  ToggleFoodStatus,
  DeleteFoodItem,
  FetchAllFoodItem,
  ToggleCategoryStatus,
} = require("../controllers/menu-controler");
const router = express.Router();
const multer = require("multer");
const slugify = require("slugify");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/user/food-items");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, slugify(req.body.name) + "-" + uniqueSuffix + ".jpg");
  },
});

const upload = multer({ storage: storage });

router.post("/add-category", verifyToken, CreateCategory);
router.get("/fetch-categories", verifyToken, ReadCategory);
router.post("/update-category", verifyToken, UpdateCategory);
router.put("/update-category-status", verifyToken, ToggleCategoryStatus);
router.post("/delete-category", verifyToken, DeleteCategory);

router.post("/add-food-item", verifyToken, upload.single("image"), AddFoodItem);
router.get("/food-item", verifyToken, ReadFoodItem);
router.put(
  "/update-food-item",
  verifyToken,
  upload.single("image"),
  UpdateFoodItem
);

router.delete("/delete-food-item", verifyToken, DeleteFoodItem);
router.get("/food-item-status", verifyToken, ToggleFoodStatus);
router.get("/fetch-food-items", verifyToken, FetchAllFoodItem);

router.get("/public/menu/:slug", verifyToken);
module.exports = router;
