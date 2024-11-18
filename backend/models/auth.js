const User = require("../schemas/User");
const jwt = require("jsonwebtoken");
const ERRORS = require("../enums/Errors");

// This function authenticates the user to allow him do some tasks
const auth = async (req, res, next) => {
  try {
    let token = req.body.token;
    // this is because if I send query in a GET or DELETE request and I want to access it 
    if (req.query.token != undefined) {
      token = req.query.token
    }
    // After decode the token I can get the id of the user 
    // because I made the token using the id of the user
    const decodedToken = await decodedTokenFunc(token, "myFlex")
    if (!decodedToken) {
      throw new Error();
    }
    // Now we can find the user by decoding the token 
    const user = await User.findOne({
      _id: decodedToken._id,
      "tokens.token": token,
    });
    if (!user) {
      throw new Error();
    }
    // spreading the token and the user out of this function to be used afterward. 
    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.send({ errorCode: ERRORS.UNAUTHORIZED, errorMessage: "UNAUTHORIZED" });
  }
};

const decodedTokenFunc = async (token, key) => {
  try {
    return jwt.verify(token, key)
  } catch (err) {
    return false
  }
}

module.exports = auth;