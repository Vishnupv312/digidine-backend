const cloudinary = require("cloudinary").v2;

//CONFIG KRTE WAQT 3 cheeze hi deni hai
module.exports.configCloudinary = async () => {
  try {
    const cloudinaryResponse = cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.APP_SECRET,
    });
    if (cloudinaryResponse)
      return console.log("cloudinary configured successfully");
  } catch (err) {
    console.log("Error while configuring Cloudinary");
    console.log(err);
  }
};

module.exports.uploadImage = async (file) => {
  try {
    return await cloudinary.uploader.upload(file); // file is path string
  } catch (err) {
    console.log("Upload failed:", err);
    return null;
  }
};
