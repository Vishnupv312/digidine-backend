const express = require("express");
const app = express();
const db = require("./config/db");
const routes = require("./routes");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
var cors = require("cors");

dotenv.config();

db();

app.use(
  cors({
    origin: "http://localhost:3000", // frontend URL
    credentials: true, // 🔥 allow cookies to be sent
  })
);
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use("/api", routes);

app.get("/", async (req, res) => {
  res.send("succcess");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
