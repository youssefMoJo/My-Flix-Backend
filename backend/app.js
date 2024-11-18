const express = require("express");
const app = express();
const userRoutes = require("./routes/user");
const moviesRoutes = require("./routes/movies");
const mongoose = require("mongoose");
const mongodbLink = "mongodb://localhost:27017/MyFlex";
mongoose.connect(mongodbLink, {});

app.use(express.json());
app.use(userRoutes);
app.use(moviesRoutes);

app.listen(3000, () => {
  console.log("the server is running ");
});
