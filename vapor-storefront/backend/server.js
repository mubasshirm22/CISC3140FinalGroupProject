require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db/db.js");
const productRoutes = require("./routes/productRoutes.js");
const cors = require("cors");
const authMiddleware = require("./middleware/authMiddleware.js");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const libraryRoutes = require("./routes/libraryRoutes");



const app = express();
app.use(express.json());
app.use(cors());
app.use("/", productRoutes);
app.use("/", authRoutes);
app.use("/cart", cartRoutes);
app.use("/library", libraryRoutes);



// TEST ROUTE
app.get("/", (req, res) => {
    res.send("Vapor backend is running");
});

const PORT = 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
