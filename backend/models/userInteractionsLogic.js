const filteringHelper = require("./filteringHelper");
const TMDBApi = require("./TMDBApi");
const User = require("../schemas/User");
const Movie = require("../schemas/Movie");
const { ObjectID } = require("mongodb");

class userInteractionsLogic {

    static async createNewUser(req) {
        let toBeReturned = {}
        toBeReturned.emailExists = (await User.findOne({ email: req.body.email }).countDocuments()) !== 0;
        toBeReturned.userNameExists = (await User.findOne({ username: req.body.username }).countDocuments()) !==
            0;
        toBeReturned.user = new User(req.body)

        return toBeReturned
    }
    static loginAsGuest() {
        const randomID = Math.floor(Math.random() * 10000);
        const username = "Guest - " + randomID;
        const email = "Guest-" + randomID + "@guest.com";
        const password = randomID;
        const user = new User({ username, email, password });
        return user
    }
    static async login(req) {
        let toBeReturned = {}
        let username = req.body.username ? req.body.username : null
        let email = req.body.email ? req.body.email : null
        const user = await User.findByCredentials(
            email,
            username,
            req.body.password
        );
        const token = await user.generatingTokens();
        toBeReturned.user = user
        toBeReturned.token = token

        return toBeReturned
    }

    static async logout(user, req) {
        // Remove a specific token when the user wants to log out.
        user.tokens = user.tokens.filter((eachToken) => {
            return eachToken.token != req.token;
        });
        await user.save();
    }

    static async addMovieToYourList(user, req) {
        // This filters the req.body and returns an object with (watched and rating).
        const formatResponse = filteringHelper.filterWatchLaterMovie(req.body);
        // Get the index of that movie if I have it in my list
        const movieIndex = user.movies.findIndex(
            (movie) => movie.TMDB_Id === req.body.id
        );
        // Check if I have that movie in my list, overwrite it
        if (movieIndex !== -1) {
            user.movies[movieIndex] = {
                ...user.movies[movieIndex]._doc,
                ...formatResponse,
            };
        } else {
            // Get a movie from the Movies collection if it exists.
            const movieExists = await Movie.findOne({ id: req.body.id });
            // if the Movies collection doesn't has that movie, 
            // add it there and then add it in my list. 
            if (movieExists === null) {
                const movie = await TMDBApi.movieDetails(req.body.id);
                const formatedMovie = filteringHelper.formatMovieToSave(movie);
                const movieID = new ObjectID();
                // Save the movie in the movies collection
                const mongoMovie = new Movie({ ...formatedMovie, _id: movieID });
                await mongoMovie.save();
                user.movies = user.movies.concat({
                    _id: movieID,
                    TMDB_Id: req.body.id,
                    ...formatResponse,
                    genres: formatedMovie.genres,
                });
                // But if the Movies collection does has that movie, just add it in my list.
            } else {
                user.movies = user.movies.concat({
                    _id: movieExists._id,
                    TMDB_Id: req.body.id,
                    ...formatResponse,
                    genres: movieExists.genres,
                });
            }
        }
        user.save();

        return movieIndex
    }

    static async getMyMoviesList(user) {
        const moviesIDList = [];

        for (let i = 0; i < user.movies.length; i++) {
            moviesIDList.push(user.movies[i]._id.toString());
        }

        // Asking the movies collection to get all my movies by passing all my movie's IDs.
        const movies = await Movie.find({ _id: { $in: moviesIDList } });
        const myMovies = [];
        movies.forEach((eachMovie) => {
            const movieIndex = user.movies.findIndex(
                (movie) => movie.TMDB_Id === eachMovie.id
            );
            // Filters every movie object I have to just contain (watched and rating).
            const formatResponse = filteringHelper.filterWatchLaterMovie(
                user.movies[movieIndex]._doc
            );

            eachMovie = { ...eachMovie._doc, ...formatResponse };
            myMovies.push(eachMovie);
        });
        return myMovies
    }

    static removeMovieFromYourList(user, req) {
        // this is because if I send query in a GET or DELETE 
        // request and I want to access it 
        let movieIndex;
        if (req.query.token != undefined) {
            movieIndex = user.movies.findIndex(
                (movie) => movie.TMDB_Id === Number(req.query.id)
            );
        } else {
            movieIndex = user.movies.findIndex(
                (movie) => movie.TMDB_Id === req.body.id
            );
        }
        if (movieIndex !== -1) {
            user.movies.splice(movieIndex, 1);
            user.save();
            return 0
        } else {
            return movieIndex
        }

    }

    static async getRecommendation(user, req) {
        if (user.movies.length > 0) {
            // Genre preferences
            const genresPref = {};
            let firstGenres = Number;
            let rating;
            // Loop through user's movies list
            for (let i = 0; i < user.movies.length; i++) {
                // If I don't put a rate for a movie, make it 5 out of 5
                rating = user.movies[i].rating === null ? 5 : user.movies[i].rating;
                // Loop throught the genres list for each movie in my list
                for (let j = 0; j < user.movies[i].genres.length; j++) {
                    // get the genre Id for each genre in the list of genres of specific movie
                    const genre = user.movies[i].genres[j].id;
                    if (i === 0 && j === 0) {
                        firstGenres = genre;
                    }
                    // If genresPref contains this genre, add the user rating of that movie to it
                    if (genresPref[genre]) {
                        genresPref[genre] += rating;
                        // otherwise, put it 
                    } else {
                        genresPref[genre] = rating;
                    }
                }
            }
            let max = genresPref[firstGenres];
            let min = genresPref[firstGenres];
            // Get the genre that has the maximum rating 
            // Get the genre that has the minimun rating 
            for (const rating in genresPref) {
                if (genresPref[rating] > max) {
                    max = genresPref[rating];
                } else if (genresPref[rating] < min) {
                    min = genresPref[rating];
                }
            }

            const range = max - min;
            const with_genres = [];
            const without_genres = [];
            // After getting the range, we will divide it to halves and loop through our Genre preferences.
            // for each genre that has a rating above the half, we will add it to the with_genres list.
            // otherwise we will add it to the without_genres list.
            for (const rating in genresPref) {
                if (genresPref[rating] > (range / 2)) {
                    with_genres.push(rating);
                } else {
                    without_genres.push(rating);
                }
            }

            const { movies } = await TMDBApi.discoverForRecommendations(
                with_genres,
                without_genres,
                req.query.page
            );
            const formatedResponse = filteringHelper.formatMovies(movies);
            const injectedFormatedMoveies = filteringHelper.injectWatchedToMovies(
                user.movies,
                formatedResponse
            );
            if (injectedFormatedMoveies.length !== 0) {
                return injectedFormatedMoveies
            } else {
                return this.getPopularMovies(req)
            }
        }
    }
    // If the user doesn't has any movie in the list,
    // we will get some popular movies to the user.
    static async getPopularMovies(req) {
        const popularMovies = await TMDBApi.getPopular(req.query.page);
        const formatedMovies = filteringHelper.formatMovies(popularMovies);
        return formatedMovies
    }
}

module.exports = userInteractionsLogic;
