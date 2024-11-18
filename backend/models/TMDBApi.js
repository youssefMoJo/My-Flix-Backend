const axios = require("axios");

const API_URL = "https://api.themoviedb.org/3/";
const API_KEY = "eb91c6567de9316310acef7aaad55041";

/**
 * This TMDBApi class has some methods that allow
 * us to communicate directly with the TMDB API.
*/
class TMDBApi {

  /**
   * This method will format the object to a 
   * query string that can be passed to a URL.
   * @param {Object} params - object that contains the page
   * @returns {String} - query string
   */
  static formatPramaters(params) {
    let formatedParams = "";
    for (let [param, value] of Object.entries(params)) {
      formatedParams = `${formatedParams}&${param}=${value}`;
    }
    return formatedParams;
  }

  /**
   * This method will discover movies by genres and 
   * return list of movies based on user's list.
   * @param {Array} with_genres - List of genre ids that you want to include in the results.
   * @param {Array} without_genres - List of genre ids that you want to exclude from the results.
   * @param {integer} page 
   * @returns {Object} - Contains list of movies and if there is more movie or not.
   */
  static async discoverForRecommendations(
    with_genres = [],
    without_genres = [],
    page = 1
  ) {
    const url = `${API_URL}discover/movie?api_key=${API_KEY}&without_genres=${without_genres.join(
      ","
    )}&with_genres=${with_genres.join(",")}&page=${page}`;
    return await axios
      .get(url)
      .then((res) => {
        return { movies: res.data.results, hasMore: res.data.page < page };
      })
      .catch((err) => {
        console.log(err)
        return undefined;
      });
  }

  /**
   * This method will search for movies.
   * @param {String} query - Movie name.
   * @param {Object} peramateres - Object that has the page number. 
   * @returns {Array} - Contains objects for movies that has the same name.
   */
  static async searchMovies(query, peramateres = {}) {
    const url = `${API_URL}search/movie?api_key=${API_KEY}&query=${query}${this.formatPramaters(
      peramateres
    )}`;
    return await axios
      .get(url)
      .then((res) => {
        return res.data.results;
      })
      .catch((err) => {
        // console.log(err)
        return undefined;
      });
  }

  /**
   * This method will get all the popular movies in page 1 in the TMDB API.
   * @param {integer} page 
   * @returns {Array} - Contains objects for movies that has the same name.
   */
  static async getPopular(page = 1) {
    const url = `${API_URL}movie/popular?api_key=${API_KEY}&page=${page}`;
    return await axios
      .get(url)
      .then((res) => {
        return res.data.results;
      })
      .catch((err) => {
        // console.log(err)
        return undefined;
      });
  }

  /**
   * Get the primary information about a movie.
   * @param {integer} movieId 
   * @param {Array} extraMovieInfo - List of extra information about a movie.
   * @returns {Object}
   */
  static async movieDetails(movieId, extraMovieInfo = []) {
    const url = `${API_URL}movie/${movieId}?api_key=${API_KEY}&append_to_response=${extraMovieInfo.join(
      ","
    )}`;
    return await axios
      .get(url)
      .then((res) => {
        return res.data;
      })
      .catch((err) => {
        // console.log(err)
        return undefined;
      });
  }
}

module.exports = TMDBApi;
