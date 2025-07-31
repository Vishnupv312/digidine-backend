const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage, registerFont } = require("canvas");
const QRCode = require("qrcode");
const RestaurantModel = require("../models/restaurant-model");
const QRCodeModel = require("../models/qrcode-model");
const { uploadImage } = require("../config/cloudinary");
const mongoose = require("mongoose");
// Modify the GenerateQRCode function to handle themes

module.exports.GenerateQRCode = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const restaurant = await RestaurantModel.findById(req.user.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    let QrColor = req.body.foregroundColor
      ? req.body.foregroundColor
      : "#0000ff";
    let QrCodeBg = req.body.backgroundColor
      ? req.body.backgroundColor
      : "#ffffff";
    const slug = restaurant.slug;
    const restaurantName = restaurant.restaurantName;
    const theme = req.body.theme || "classic";
    const qrUrl = `${process.env.FRONTEND_URI}menu/${slug}`;

    // Generate QR Code as a data URL
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      color: {
        dark: QrColor,
        light: QrCodeBg,
      },
    });

    // Register fonts
    let fontPathOswald = path.join(
      __dirname,
      "../public/fonts/Oswald/Oswald-VariableFont_wght.ttf"
    );
    let fontPathPlayfair = path.join(
      __dirname,
      "../public/fonts/Playfair_Display/PlayfairDisplay-VariableFont_wght.ttf"
    );
    registerFont(fontPathOswald, { family: "Oswald" });
    registerFont(fontPathPlayfair, { family: "Playfair Display" });

    // Canvas setup
    const scaleFactor = 3;
    let width, height;

    // Set dimensions based on theme
    switch (theme) {
      case "modern":
        width = 400 * scaleFactor;
        height = 400 * scaleFactor;
        break;
      case "elegant":
        width = 500 * scaleFactor;
        height = 600 * scaleFactor;
        break;
      default: // classic
        width = 400 * scaleFactor;
        height = 500 * scaleFactor;
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fill background
    ctx.fillStyle = QrCodeBg;
    ctx.fillRect(0, 0, width, height);

    // Load QR Code
    const qrImage = await loadImage(qrDataUrl);

    // Apply theme-specific designs
    switch (theme) {
      case "modern":
        // Modern theme - minimalist with logo placeholder
        ctx.fillStyle = QrColor;
        ctx.fillRect(0, 0, width, 60 * scaleFactor);

        // Draw restaurant name in header
        ctx.font = `${18 * scaleFactor}px Oswald`;
        ctx.fillStyle = QrCodeBg;
        ctx.textAlign = "center";
        ctx.fillText(restaurantName.toUpperCase(), width / 2, 40 * scaleFactor);

        // Draw QR code with white border
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          50 * scaleFactor - 10,
          80 * scaleFactor - 10,
          300 * scaleFactor + 20,
          300 * scaleFactor + 20
        );
        ctx.drawImage(
          qrImage,
          50 * scaleFactor,
          80 * scaleFactor,
          300 * scaleFactor,
          300 * scaleFactor
        );

        // Add logo placeholder
        ctx.beginPath();
        ctx.arc(
          width / 2,
          80 * scaleFactor - 20 * scaleFactor,
          20 * scaleFactor,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = QrColor;
        ctx.fill();
        ctx.strokeStyle = QrCodeBg;
        ctx.lineWidth = 3 * scaleFactor;
        ctx.stroke();

        // Add "Scan Me" text
        ctx.font = `${12 * scaleFactor}px Oswald`;
        ctx.fillStyle = QrColor;
        ctx.fillText("SCAN ME", width / 2, 400 * scaleFactor);
        break;

      case "elegant":
        // Elegant theme - stylish frame
        // Draw decorative border
        ctx.strokeStyle = QrColor;
        ctx.lineWidth = 8 * scaleFactor;
        ctx.strokeRect(
          20 * scaleFactor,
          20 * scaleFactor,
          width - 40 * scaleFactor,
          height - 40 * scaleFactor
        );

        // Draw QR code with offset
        ctx.drawImage(
          qrImage,
          100 * scaleFactor,
          100 * scaleFactor,
          300 * scaleFactor,
          300 * scaleFactor
        );

        // Add restaurant name with elegant font
        ctx.font = `${24 * scaleFactor}px "Playfair Display"`;
        ctx.fillStyle = QrColor;
        ctx.textAlign = "center";
        ctx.fillText(restaurantName, width / 2, 450 * scaleFactor);

        // Add decorative elements
        ctx.beginPath();
        ctx.moveTo(50 * scaleFactor, 70 * scaleFactor);
        ctx.lineTo(70 * scaleFactor, 50 * scaleFactor);
        ctx.moveTo(width - 50 * scaleFactor, 70 * scaleFactor);
        ctx.lineTo(width - 70 * scaleFactor, 50 * scaleFactor);
        ctx.moveTo(50 * scaleFactor, height - 70 * scaleFactor);
        ctx.lineTo(70 * scaleFactor, height - 50 * scaleFactor);
        ctx.moveTo(width - 50 * scaleFactor, height - 70 * scaleFactor);
        ctx.lineTo(width - 70 * scaleFactor, height - 50 * scaleFactor);
        ctx.stroke();

        // Add "Menu" text
        ctx.font = `${14 * scaleFactor}px "Playfair Display"`;
        ctx.fillStyle = "#888";
        ctx.fillText("Digital Menu", width / 2, 490 * scaleFactor);
        break;

      default:
        // Classic theme - simple design
        ctx.drawImage(
          qrImage,
          50 * scaleFactor,
          50 * scaleFactor,
          300 * scaleFactor,
          300 * scaleFactor
        );

        // Draw Restaurant Name
        ctx.font = `${20 * scaleFactor}px Oswald`;
        ctx.fillStyle = QrColor;
        ctx.textAlign = "center";
        ctx.fillText(restaurantName, width / 2, 380 * scaleFactor);

        // Draw "Generated by DigiDine"
        ctx.font = `${10 * scaleFactor}px Oswald`;
        ctx.fillStyle = "#888";
        ctx.fillText(
          "Generated by DigiDine",
          330 * scaleFactor,
          490 * scaleFactor
        );
    }

    // Save and upload the image
    const qrDir = path.join(__dirname, "../public/uploads/user/qr-code");
    fs.mkdirSync(qrDir, { recursive: true });

    const filePath = path.join(qrDir, `${slug}-${theme}.png`);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(filePath, buffer);

    const cloudinaryUploadResponse = await uploadImage(filePath);
    const relativePath = `public/uploads/user/qr-code/${slug}-${theme}.png`;

    const StoreQr = await QRCodeModel.create({
      restaurant: req.user.id,
      slugUrl: slug,
      qrImageUrl: cloudinaryUploadResponse.secure_url,
      theme: theme,
      foregroundColor: QrColor,
      backgroundColor: QrCodeBg,
    });

    if (StoreQr) {
      res.status(200).json({
        message: "Custom QR Code generated",
        data: StoreQr,
        qrCodeUrl: relativePath,
      });
    }
  } catch (err) {
    console.error("QR Code generation failed:", err);
    return res.status(500).json({ message: "QR Code generation failed" });
  }
};

module.exports.UpdateQRCodeTheme = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { theme, foregroundColor, backgroundColor } = req.body;
    const qrCodeId = req.params.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(qrCodeId)) {
      return res.status(400).json({ message: "Invalid QR Code ID format" });
    }

    // Find the QR code and verify ownership
    const qrCode = await QRCodeModel.findOne({
      _id: new mongoose.Types.ObjectId(qrCodeId),
      restaurant: new mongoose.Types.ObjectId(req.user.id),
    });

    if (!qrCode) {
      return res.status(404).json({ message: "QR Code not found" });
    }

    // Regenerate the QR code with new theme
    const restaurant = await RestaurantModel.findById(req.user.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const qrUrl = `${process.env.FRONTEND_URI}menu/${restaurant.slug}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      color: {
        dark: foregroundColor || qrCode.foregroundColor,
        light: backgroundColor || qrCode.backgroundColor,
      },
    });

    // Register fonts
    let fontPathOswald = path.join(
      __dirname,
      "../public/fonts/Oswald/Oswald-VariableFont_wght.ttf"
    );
    let fontPathPlayfair = path.join(
      __dirname,
      "../public/fonts/Playfair_Display/PlayfairDisplay-VariableFont_wght.ttf"
    );
    registerFont(fontPathOswald, { family: "Oswald" });
    registerFont(fontPathPlayfair, { family: "Playfair Display" });

    // Canvas setup
    const scaleFactor = 3;
    let width, height;

    // Set dimensions based on theme
    switch (theme) {
      case "modern":
        width = 400 * scaleFactor;
        height = 400 * scaleFactor;
        break;
      case "elegant":
        width = 500 * scaleFactor;
        height = 600 * scaleFactor;
        break;
      default: // classic
        width = 400 * scaleFactor;
        height = 500 * scaleFactor;
    }

    // Create canvas instance
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fill background
    ctx.fillStyle = backgroundColor || qrCode.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Load QR Code
    const qrImage = await loadImage(qrDataUrl);

    // Apply theme-specific designs (same as in GenerateQRCode)
    switch (theme) {
      case "modern":
        // Modern theme - minimalist with logo placeholder
        ctx.fillStyle = foregroundColor || qrCode.foregroundColor;
        ctx.fillRect(0, 0, width, 60 * scaleFactor);

        // Draw restaurant name in header
        ctx.font = `${18 * scaleFactor}px Oswald`;
        ctx.fillStyle = backgroundColor || qrCode.backgroundColor;
        ctx.textAlign = "center";
        ctx.fillText(
          restaurant.restaurantName.toUpperCase(),
          width / 2,
          40 * scaleFactor
        );

        // Draw QR code with white border
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          50 * scaleFactor - 10,
          80 * scaleFactor - 10,
          300 * scaleFactor + 20,
          300 * scaleFactor + 20
        );
        ctx.drawImage(
          qrImage,
          50 * scaleFactor,
          80 * scaleFactor,
          300 * scaleFactor,
          300 * scaleFactor
        );

        // Add logo placeholder
        ctx.beginPath();
        ctx.arc(
          width / 2,
          80 * scaleFactor - 20 * scaleFactor,
          20 * scaleFactor,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = foregroundColor || qrCode.foregroundColor;
        ctx.fill();
        ctx.strokeStyle = backgroundColor || qrCode.backgroundColor;
        ctx.lineWidth = 3 * scaleFactor;
        ctx.stroke();

        // Add "Scan Me" text
        ctx.font = `${12 * scaleFactor}px Oswald`;
        ctx.fillStyle = foregroundColor || qrCode.foregroundColor;
        ctx.fillText("SCAN ME", width / 2, 400 * scaleFactor);
        break;

      case "elegant":
        // Elegant theme - stylish frame
        // Draw decorative border
        ctx.strokeStyle = foregroundColor || qrCode.foregroundColor;
        ctx.lineWidth = 8 * scaleFactor;
        ctx.strokeRect(
          20 * scaleFactor,
          20 * scaleFactor,
          width - 40 * scaleFactor,
          height - 40 * scaleFactor
        );

        // Draw QR code with offset
        ctx.drawImage(
          qrImage,
          100 * scaleFactor,
          100 * scaleFactor,
          300 * scaleFactor,
          300 * scaleFactor
        );

        // Add restaurant name with elegant font
        ctx.font = `${24 * scaleFactor}px "Playfair Display"`;
        ctx.fillStyle = foregroundColor || qrCode.foregroundColor;
        ctx.textAlign = "center";
        ctx.fillText(restaurant.restaurantName, width / 2, 450 * scaleFactor);

        // Add decorative elements
        ctx.beginPath();
        ctx.moveTo(50 * scaleFactor, 70 * scaleFactor);
        ctx.lineTo(70 * scaleFactor, 50 * scaleFactor);
        ctx.moveTo(width - 50 * scaleFactor, 70 * scaleFactor);
        ctx.lineTo(width - 70 * scaleFactor, 50 * scaleFactor);
        ctx.moveTo(50 * scaleFactor, height - 70 * scaleFactor);
        ctx.lineTo(70 * scaleFactor, height - 50 * scaleFactor);
        ctx.moveTo(width - 50 * scaleFactor, height - 70 * scaleFactor);
        ctx.lineTo(width - 70 * scaleFactor, height - 50 * scaleFactor);
        ctx.stroke();

        // Add "Menu" text
        ctx.font = `${14 * scaleFactor}px "Playfair Display"`;
        ctx.fillStyle = "#888";
        ctx.fillText("Digital Menu", width / 2, 490 * scaleFactor);
        break;

      default:
        // Classic theme - simple design
        ctx.drawImage(
          qrImage,
          50 * scaleFactor,
          50 * scaleFactor,
          300 * scaleFactor,
          300 * scaleFactor
        );

        // Draw Restaurant Name
        ctx.font = `${20 * scaleFactor}px Oswald`;
        ctx.fillStyle = foregroundColor || qrCode.foregroundColor;
        ctx.textAlign = "center";
        ctx.fillText(restaurant.restaurantName, width / 2, 380 * scaleFactor);

        // Draw "Generated by DigiDine"
        ctx.font = `${10 * scaleFactor}px Oswald`;
        ctx.fillStyle = "#888";
        ctx.fillText(
          "Generated by DigiDine",
          330 * scaleFactor,
          490 * scaleFactor
        );
    }

    // Convert canvas to buffer
    const buffer = canvas.toBuffer("image/png");

    // Save and upload the new image
    const qrDir = path.join(__dirname, "../public/uploads/user/qr-code");
    fs.mkdirSync(qrDir, { recursive: true });
    const filePath = path.join(qrDir, `${restaurant.slug}-${theme}.png`);
    fs.writeFileSync(filePath, buffer);

    const cloudinaryUploadResponse = await uploadImage(filePath);

    // Update the QR code record
    const updatedQR = await QRCodeModel.findByIdAndUpdate(
      qrCodeId,
      {
        theme,
        foregroundColor: foregroundColor || qrCode.foregroundColor,
        backgroundColor: backgroundColor || qrCode.backgroundColor,
        qrImageUrl: cloudinaryUploadResponse.secure_url,
      },
      { new: true }
    );

    res.status(200).json({
      message: "QR Code theme updated successfully",
      data: updatedQR,
    });
  } catch (err) {
    console.error("QR Code theme update failed:", err);
    return res.status(500).json({ message: "QR Code theme update failed" });
  }
};

module.exports.FetchQrCode = async (req, res) => {
  try {
    let findQrCode = await QRCodeModel.findOne({ restaurant: req.user.id });
    if (!findQrCode) return res.status(503).json({ status: 0 });
    res.status(200).json({ status: 1, data: findQrCode });
  } catch (err) {
    console.log(err);
  }
};
