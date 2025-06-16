require("dotenv").config();
const express = require("express");
const app = express();
const db = require("./config/db");
const routes = require("./routes");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
var cors = require("cors");
const { configCloudinary } = require("./config/cloudinary");
const passport = require("passport");
const PassportSetup = require("./config/passport-setup");

db();
configCloudinary();
app.use("/public", express.static("public"));

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://digidine-frontend.vercel.app",
    ], // Add both variations
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Access-Control-Allow-Origin",
    ],
  })
);
const PORT = process.env.PORT || 3000;

app.use(passport.initialize());

app.use(express.json());
app.use(cookieParser());
app.use("/api", routes);

app.get("/", async (req, res) => {
  res.send("succcess");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
