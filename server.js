const express = require("express");
const app = express();
const db = require("./config/db");
const routes = require("./routes");

const dotenv = require("dotenv");
dotenv.config();

db();

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
