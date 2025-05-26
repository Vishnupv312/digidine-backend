const slugify = require("slugify");
const Restaurant = require("../models/restaurant-model");

module.exports.generateUniqueSlug = async (name) => {
  const baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;

  // Loop to find a unique slug
  while (await Restaurant.findOne({ slug })) {
    slug = `${baseSlug}-${count}`;
    count++;
  }

  return slug;
};
