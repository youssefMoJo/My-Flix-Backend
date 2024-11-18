const ERRORS = require("../enums/Errors");
const userInteractionsLogic = require("../models/userInteractionsLogic")

module.exports = {

    // Create a new user - Sign up
    createNewUser: async (req, res) => {
        let allResults = await userInteractionsLogic.createNewUser(req)
        const emailExists = allResults.emailExists
        const userNameExists = allResults.userNameExists
        const user = allResults.user
        try {
            await user.HashThePassword();
            const token = await user.generatingTokens();
            res.status(200).send({ user, token, successMessage: "user signed up successfully" });
        } catch (e) {
            if (e.errors?.email.properties.message == "Invalid email") {
                res.send({ errorCode: ERRORS.INVALID_EMAIL, errorMessage: "INVALID_EMAIL" });
            } else if (emailExists) {
                res.send({ errorCode: ERRORS.EMAIL_EXISTS, errorMessage: "EMAIL_EXISTS" });
            } else if (userNameExists) {
                res.send({ errorCode: ERRORS.USERNAME_EXISTS, errorMessage: "USERNAME_EXISTS" });
            }
        }
    },

    // Login as Guest
    loginAsGuest: async (req, res) => {
        const user = userInteractionsLogic.loginAsGuest()
        try {
            await user.HashThePassword();
            const token = await user.generatingTokens();
            res.status(200).send({ user, token, guest: true });
        } catch (e) {
            if (e.message) {
                res.status(400).send({ errorCode: ERRORS.INVALID_EMAIL, errorMessage: "INVALID_EMAIL" });
            }
        }
    },

    // Login the user
    login: async (req, res) => {
        try {
            let allResults = await userInteractionsLogic.login(req)
            let user = allResults.user
            let token = allResults.token
            res.send({ user, token, successMessage: "user logged in successfully" });
        } catch (e) {
            res.send({ errorCode: ERRORS.UNABLE_TO_LOGIN, errorMessage: "UNABLE_TO_LOGIN" });
        }
    },

    // Get my profile
    getMyProfile: async (req, res) => {
        let user = req.user
        res.status(200).send({ user, successMessage: "received my profile" });
    },

    // Logout the user
    logout: async (req, res) => {
        try {
            let user = req.user
            // Remove a specific token when the user wants to log out.
            await userInteractionsLogic.logout(user, req)
            res.send({ user, successMessage: "logger out successfully" });
        } catch (e) {
            console.log(e);
            res.status(500).send();
        }
    },

    // Add a movie to your list
    addMovieToYourList: async (req, res) => {
        try {
            const user = req.user;
            let movieIndex = await userInteractionsLogic.addMovieToYourList(user, req)

            // Check if I have that movie in my list, overwrite it
            if (movieIndex !== -1) {
                res.send({ successMessage: "The movie is already in your list and any new changes is saved :)" });
            } else {
                res.send({ successMessage: "Movie Added Succecfully" });
            }
        } catch (err) {
            res.send({ errorMessage: "something went wrong, try again later!" });
        }
    },

    // Get my movies list
    getMyMoviesList: async (req, res) => {
        try {
            const user = req.user;
            let myMovies = await userInteractionsLogic.getMyMoviesList(user)
            res.send({ myMovies, successMessage: "received my list succecfully" });
        } catch (err) {
            res.status(400).send(err);
        }
    },

    // Remove a movie from your list.
    removeMovieFromYourList: (req, res) => {
        try {
            const user = req.user;
            let movieIndex = userInteractionsLogic.removeMovieFromYourList(user, req)

            // making sure that I have that movie
            if (movieIndex === -1) {
                throw new Error();
            }

            res.send({ successMessage: "Movie removed Succecfully" });
        } catch (e) {
            res.send({ errorMessage: "The movie is already removied" });
        }
    },

    // Get reccomendations.
    getRecomendations: async (req, res) => {
        try {
            const user = req.user;
            const getReccomendationsOrPopularMovies = await userInteractionsLogic.getRecommendation(user, req)
            res.send(getReccomendationsOrPopularMovies)

        } catch (err) {
            console.error(err);
            res.status(400).send(err);
        }
    }
}