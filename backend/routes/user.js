const express = require("express");
const router = new express.Router();
const auth = require("../models/auth");
const userController = require("../controllers/UserController")

// Create a new user - Sign up
router.post("/myFlex/api/v1/signup", userController.createNewUser);

// Login as Guest
router.post("/myFlex/api/v1/login/guest", userController.loginAsGuest);

// Login the user
router.post("/myFlex/api/v1/login", userController.login);

// Get my profile
router.get("/myFlex/api/v1/user", auth, userController.getMyProfile);

// Logout the user
router.post("/myFlex/api/v1/logout", auth, userController.logout);

// Add a movie to your list
router.patch("/myFlex/api/v1/user/list", auth, userController.addMovieToYourList);

// Get my movies list
router.get("/myFlex/api/v1/user/list", auth, userController.getMyMoviesList);

// Remove a movie from your list.
router.delete("/myFlex/api/v1/user/list", auth, userController.removeMovieFromYourList);

// Get reccomendations.
router.get("/myFlex/api/v1/user/recommendations", auth, userController.getRecomendations);

module.exports = router;
