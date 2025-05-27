const CategoryModel = require("../models/menu-category-model");
const FoodItem = require("../models/food-item-model");
const slugify = require("slugify");
const foodItemModel = require("../models/food-item-model");
const restaurantModel = require("../models/restaurant-model");
const debug = require("debug")("app:menu-controller");

module.exports.CreateCategory = async (req, res) => {
  let { name, description, order } = req.body;

  try {
    let createdCategory = await CategoryModel.create({
      name,
      description,
      order,
      restaurant: req.user.id,
    });

    if (createdCategory) {
      res.status(200).json({
        message: "category added successfully",
        category: createdCategory,
      });
    } else res.status(400).json({ message: "error while adding the category" });
  } catch (err) {
    res
      .status(501)
      .json({ message: "Something went wrong ", error: err.message });
  }
};

module.exports.ReadCategory = async (req, res) => {
  let findCategory = await CategoryModel.find({ restaurant: req.user.id });
  try {
    let categoryFoodItems = await Promise.all(
      //keeping it in the promise so database fetch happens then only response is done
      findCategory.map(async (category) => {
        //promise.all so that the map loops in async
        const foodItemsList = await foodItemModel.find({
          category: category._id,
        });
        let foodItems = foodItemsList.map((item) => item._id);
        return { ...category._doc, foodItems };
      })
    );
    res.status(200).json({ data: categoryFoodItems });
  } catch (err) {
    res
      .status(501)
      .json({ message: "Something went wrong ", error: err.message });
  }
};

module.exports.ToggleCategoryStatus = async (req, res) => {
  let categoryId = req.body.id;
  try {
    let categoryById = await CategoryModel.findOne({
      _id: categoryId,
      restaurant: req.user.id,
    });
    if (!categoryById)
      return res.status(404).json({ message: "Category not found" });
    console.log(categoryById);
    let newStatus = !categoryById.status;
    console.log(newStatus);
    let findCategoryId = await CategoryModel.findOneAndUpdate(
      { _id: categoryId }, // filter
      { $set: { status: newStatus } }, // update
      { new: true } // options
    );
    console.log(newStatus);
    let findCategoryFoodItems = await foodItemModel.updateMany(
      { category: categoryId },
      {
        $set: { status: newStatus },
      }
    );
    console.log(findCategoryFoodItems);

    if (
      findCategoryFoodItems?.matchedCount !== 0 &&
      findCategoryFoodItems?.modifiedCount !== 0
    ) {
      res.status(200).json({ message: "updated successfully" });
    } else {
      throw new Error("Food item could not be updated");
    }
  } catch (error) {
    debug(error);
    console.log(error);
    res.status(503).json({ message: error.message });
  }
};

module.exports.UpdateCategory = async (req, res) => {
  let { id, name, description, order } = req.body;
  try {
    //need to add the check weather this category is owned by that restaurant owner only
    let UpdateCategory = await CategoryModel.updateOne(
      { _id: id },
      { $set: { name, description, order } },
      { upsert: false }
    );
    if (UpdateCategory.modifiedCount == 1 && UpdateCategory.matchedCount == 1) {
      let findUpdatedCategory = await CategoryModel.findOne({ _id: id });
      res.status(200).json({
        message: "category updated successfully",
        data: findUpdatedCategory,
      });
    } else {
      res.status(405).send("Please try again something went wrong ");
    }
  } catch (err) {
    res
      .status(501)
      .json({ message: "Something went wrong ", error: err.message });
  }
};

module.exports.DeleteCategory = async (req, res) => {
  try {
    let deleteCategory = await CategoryModel.deleteOne({ _id: req.body.id });
    if (deleteCategory.deletedCount === 1) {
      res.status(200).json({
        message: "Category deleted Successuly ",
        data: deleteCategory,
      });
    } else {
      res.status(504).json({
        message:
          "Something went wrong while deleting the category please try again",
      });
    }
  } catch (err) {
    res
      .status(406)
      .json({ message: "something went wrong", error: err.message });
  }
};

module.exports.AddFoodItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      isVegetarian,
      isNonVegetarian,
      ingredients,
      isSpicy,
      isAvailable,
      preparationTime,
    } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ message: "Name, price and category are required." });
    }

    // Check if restaurant exists
    const restaurant = await restaurantModel.findById(req.user.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    // Create the food item
    const newFoodItem = await FoodItem.create({
      name,
      description,
      price,
      category,
      isVegetarian,
      isNonVegetarian,
      ingredients,
      isSpicy,
      isAvailable,
      preparationTime,
      foodItemSlug: slugify(name, { lower: true, strict: true }),
      restaurant: req.user.id,
      image: req.file?.path || null,
    });

    res.status(201).json({
      message: "Food item added successfully",
      data: newFoodItem,
    });
  } catch (error) {
    console.error("Error adding food item:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports.ReadFoodItem = async (req, res) => {
  try {
    debug("Query:", req.query);

    const foodId = req.query.id;

    if (!foodId) {
      return res.status(400).json({ message: "Food ID is required" });
    }

    const findFoodItem = await foodItemModel.findById(foodId);

    if (!findFoodItem) {
      return res.status(404).json({ message: "Food item not found" });
    }

    res.status(200).json({ message: "Success", data: findFoodItem });
  } catch (error) {
    debug("Error reading food item:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports.UpdateFoodItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      isVegetarian,
      isNonVegetarian,
      ingredients,
      isSpicy,
      isAvailable,
      preparationTime,
    } = req.body;
    let foodId = req.query.id;

    if (!name || !price || !category) {
      res
        .status(503)
        .json({ message: "name, price and category are required fields " });
    } else if (!foodId) {
      res.status(504).json({ message: "food id is required" });
    }

    let image = req.file?.path; // assuming `file` is the field name
    const existingFoodItem = await foodItemModel.findOne({
      _id: foodId,
      restaurant: req.user.id,
    });

    if (!existingFoodItem) {
      return res
        .status(404)
        .json({ message: "Food item not found or unauthorized." });
    }

    //i  might need to add a condition which checks weather the food item is of the same restaurant as the token
    else {
      const updatedFoodItem = await foodItemModel.findOneAndUpdate(
        { _id: foodId, restaurant: req.user.id },
        {
          $set: {
            name,
            description,
            price,
            category,
            isVegetarian,
            isNonVegetarian,
            ingredients,
            isSpicy,
            isAvailable,
            preparationTime,
            image: image || existingFoodItem.image,
          },
        },
        { new: true }
      );
      if (!updatedFoodItem) {
        res.status(503).json({
          message:
            "Either food id is incorrect or else you are not authorized to update this food item",
        });
      } else {
        res.status(200).json({
          message: `${name} updated sucessfully `,
          data: updatedFoodItem,
        });
      }
    }
  } catch (err) {
    res.status(504).json({
      message: "something went wrong while updating the food item ",
      error: err.message,
    });
  }
};

module.exports.DeleteFoodItem = async (req, res) => {
  let foodId = req.query.id;
  const findItem = await foodItemModel.findById({
    _id: foodId,
    restaurant: req.user.id,
  });
  if (!findItem) {
    res.status(505).json({ message: "Food Item not found " });
  }
  let DeletedFoodItem = await foodItemModel.findByIdAndDelete({
    _id: foodId,
    restaurant: req.user.id,
  });
  if (!DeletedFoodItem) {
    res
      .status(501)
      .json({ message: "Could not delete the food item , Please try agian " });
  }
  res
    .status(200)
    .json({ message: "Food item deleted Sucessfully", data: DeletedFoodItem });
};

module.exports.ToggleFoodStatus = async (req, res) => {
  try {
    let id = req.query.id;
    if (!id) {
      res.status(503).json({ message: "id is required " });
    }
    const foodItem = await foodItemModel.findOne({
      _id: id,
      restaurant: req.user.id,
    });
    if (!foodItem) {
      res.status(504).json({ message: "food item not found " });
    }
    const findFoodItem = await foodItemModel.findOneAndUpdate(
      { _id: id },
      { $set: { isAvailable: !foodItem.isAvailable } },
      { new: true }
    );

    if (!findFoodItem) {
      res.status(504).json({ message: "food item not found " });
    }
    res
      .status(200)
      .json({ message: " status updated successfully", data: findFoodItem });
  } catch (err) {
    res.status(505).json({
      message:
        "something went wrong while updating the status of the food item ",
      error: err.message,
    });
  }
};

module.exports.FetchAllFoodItem = async (req, res) => {
  try {
    let AllFoodItems = await foodItemModel.find({ restaurant: req.user.id });
    if (!AllFoodItems) {
      res.status(507).json({ message: "Could not fetch all the items " });
    }
    res
      .status(200)
      .json({ message: "Food Items fetched successfully", data: AllFoodItems });
  } catch (err) {
    res.status(506).json({
      message: "Something went wrong while fetching the data",
      error: err.message,
    });
  }
};
