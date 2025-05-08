const CategoryModel = require("../models/menu-category-model");

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
    if (findCategory) {
      res.status(200).json({ data: findCategory });
    } else {
      res
        .status(402)
        .json({ message: "error in fetching the categories please try again" });
    }
  } catch (err) {
    res
      .status(501)
      .json({ message: "Something went wrong ", error: err.message });
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
  let {
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
};
