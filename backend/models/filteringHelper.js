/**
 * This filteringHelper class has some methods that do all the needed filtering 
 * for the objects it receives from the TMDB API to make them suitable for our use.
 */
class filteringHelper {
  /**
   * This method filters a movie object based on specific 
   * filtering criteria.
   * @param {Object} obj - Movie object.
   * @param {Object} filter - specific filtering criteria object.
   * @returns {Object} - Formatted movie object.
   */
  static filterObj(obj, filter) {
    let result = {};
    for (let [key, value] of Object.entries(filter)) {
      if (obj[key] !== undefined) {
        if (typeof filter[key] === "object" && !Array.isArray(value)) {
          result[key] = this.filterObj(obj[key], value);
        } else if (Array.isArray(value)) {
          const formatedArray = [];
          obj[key].forEach((eachObj) => {
            formatedArray.push(this.filterObj(eachObj, value[0]));
          });
          result[key] = formatedArray;
        } else {
          result[key] = obj[key];
        }
      }
    }
    return result;
  }

  /**
   * This method filters every movie object in 
   * the movies list based on specific filtering criteria.
   * @param {Array} movies - Contains objects for movies.
   * @returns {Array} - Formatted movies array.
   */
  static formatMovies(movies) {
    const movieFilter = {
      id: true,
      title: true,
      overview: true,
      poster_path: true,
      vote_average: true,
    };
    const moviesList = [];
    movies.forEach((movie) => {
      moviesList.push(this.filterObj(movie, movieFilter));
    });
    return moviesList;
  }

  /**
   * This method filters the object about a specific 
   * movie to be suitable for saving in the Movies collection based 
   * on specific filtering criteria.
   * @param {Object} movie 
   * @returns {Object} - Formatted movie object.
   */
  static formatMovieToSave(movie) {
    const movieFilter = {
      id: true,
      title: true,
      overview: true,
      poster_path: true,
      vote_average: true,
      genres: true,
    };

    return this.filterObj(movie, movieFilter);
  }

  /**
   * This method will go through each movie in both lists 
   * and check if each movie is in your list and if yes, it
   * will add (watched and added) to the object.
   * @param {Array} userMovies 
   * @param {Array} formatedMovies - List of movies from the TMDB API. 
   * @returns {Array} - Formatted movies array.
   */
  static injectWatchedToMovies(userMovies, formatedMovies) {
    for (let i = 0; i < formatedMovies.length; i++) {
      const movieIndex = userMovies.findIndex(
        (movie) => movie.TMDB_Id === formatedMovies[i].id
      );
      if (movieIndex !== -1) {
        formatedMovies[i] = {
          isAdded: true,
          ...formatedMovies[i],
          ...userMovies[movieIndex]._doc,
        };
      } else {
        formatedMovies[i].isAdded = false;
        formatedMovies[i].watched = false;
      }
    }
    return formatedMovies;
  }

  /**
   * This method filters the primary information object 
   * about a movie based on specific filtering criteria.
   * @param {Object} movie 
   * @returns {Object} - Formatted movie object.
   */
  static formatMovie(movie) {
    const movieExtraInfoFilter = {
      id: true,
      title: true,
      overview: true,
      poster_path: true,
      release_date: true,
      genres: true,
      runtime: true,
      vote_average: true,
      videos: { results: [{ key: true }] },
      credits: { cast: [{ name: true }] },
    };
    return this.filterObj(movie, movieExtraInfoFilter);
  }

  /**
   * This method filters the incoming request 
   * based on specific filtering criteria.
   * @param {Object} movie 
   * @returns {Object}
   */
  static filterWatchLaterMovie(movie) {
    const watchLaterFilter = { watched: "true", rating: "true" };
    return this.filterObj(movie, watchLaterFilter);
  }
}

module.exports = filteringHelper;
