const express = require("express");
const router = new express.Router();
const auth = require("../models/auth");
const movieController = require("../controllers/MovieController");

// Search for a movie and return a list of movies with the same name.
router.get("/myFlex/api/v1/search/movie", auth, movieController.searchForMovie);

// Get all the details about specific movie.
router.get(
  "/myFlex/api/v1/movie",
  movieController.getDetailsAboutSpecificMovie
);

module.exports = router;
