const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    required: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email");
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  movies: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
      },
      TMDB_Id: {
        type: Number,
      },
      watched: {
        type: Boolean,
        default: false,
      },
      rating: {
        type: Number,
        default: null,
        max: 5,
      },
      genres: {
        type: Object,
      },
    },
  ],
});

// Log the user in
userSchema.statics.findByCredentials = async (email, username, password) => {
  const emailExists = await User.findOne({ email });
  const userNameExists = await User.findOne({ username });
  const user = emailExists || userNameExists;
  let convertedPass = null
  let checkPass;
  if (!user) {
    throw new Error("Unable to login");
  }
  if (typeof password == "number") {
    convertedPass = password.toString()
  }
  if (convertedPass != null) {
    checkPass = await bcrypt.compare(convertedPass, user.password);
  } else {
    checkPass = await bcrypt.compare(password, user.password);
  }

  if (!checkPass) {
    throw new Error("Unable to login");
  }

  return user;
};

// Generating tokens
userSchema.methods.generatingTokens = async function () {
  const token = jwt.sign({ _id: this._id }, "myFlex");
  this.tokens = this.tokens.concat({ token });
  await this.save();
  return token;
};

// Hash the password before saving it into the database in the signup level
userSchema.methods.HashThePassword = async function () {
  this.password = await bcrypt.hash(this.password, 7);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
