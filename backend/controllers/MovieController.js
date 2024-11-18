const filteringHelper = require("../models/filteringHelper");
const TMDBApi = require("../models/TMDBApi");

module.exports = {
  // Search for a movie and return a list of movies with the same name.
  searchForMovie: async (req, res) => {
    try {
      // Get the user object with all details
      const user = req.user;
      const page = req.query.page ? req.query.page : 1;
      // Search for a movie and return a list of movies with the same name.
      const respone = await TMDBApi.searchMovies(req.query.searchQuery, {
        page,
      });
      const formatedResponse = filteringHelper.formatMovies(respone);
      const injectedFormatedResponse = filteringHelper.injectWatchedToMovies(
        user.movies,
        formatedResponse
      );
      res.send(injectedFormatedResponse);
    } catch (e) {
      res.status(400).send(e);
    }
  },

  // Get all the details about specific movie.
  getDetailsAboutSpecificMovie: async (req, res) => {
    try {
      const movie = await TMDBApi.movieDetails(req.query.searchQuery, [
        "videos",
        "credits",
      ]);
      const formatedResponse = filteringHelper.formatMovie(movie);
      res.send(formatedResponse);
    } catch (e) {
      res.status(400).send(e);
    }
  },
};
