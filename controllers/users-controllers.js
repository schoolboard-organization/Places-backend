/* ------------------------------------------
 * File Contains:
 * 1. GET which returns ALL users
 * 2. POST which allows SIGN UP functionality
 * 3. POST which allows LOG IN functionality
 * ------------------------------------------ */
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
/*
 * * * * * * * * * * * * * * * * * * * GET for all users  * * * * * * * * * * * * * * * * * * * * *
 */
const getAllUsers = async (req, res, next) => {
  // variable to store all existing users
  let allUsers;

  // tries to find all info about users EXCEPT for password
  try {
    allUsers = await User.find({}, "-password");
  } catch (error) {
    const err = new HttpError("Get all users failed", 500);
    return next(err);
  }

  // response, sends all users
  res.json({
    all_users: allUsers.map((user) => user.toObject({ getters: true })),
  });
};

/*
 * * * * * * * * * * * * * * * * * * * POST for SIGN UP * * * * * * * * * * * * * * * * * * * * *
 */
const signUp = async (req, res, next) => {
  // check for errors in req
  const errors = validationResult(req);

  console.log("MADE IT IN SIGN UP");

  // throws error if needed
  if (!errors.isEmpty()) {
    // 422 error: unprocessable errors
    return next(new HttpError("Invalid inputs, double check fields.", 422));
  }

  // grabs info from BODY
  const { name, email, password } = req.body;

  // variable to store duplicate user (if any)
  let duplicateUser;

  // .findOnd() finds one document matching criteria in the argument
  try {
    duplicateUser = await User.findOne({ email: email }); // searches for provided email in DB
  } catch (err) {
    const signUpError = new HttpError("Sign up failed, IN HERE", 500);
    return next(signUpError);
  }

  // if duplicate user is found, throw error
  if (duplicateUser) {
    const duplicateEmailError = new HttpError("Email already in use", 422);
    return next(duplicateEmailError);
  }

  // hashing password using bcrypt
  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Error hashing password", 500);
    return next(error);
  }

  // otherwise, create a new user
  const newUser = new User({
    name,
    // id: Math.random(),
    email,
    imageURL: req.file.path,
    password: hashedPassword,
    places: [], // every user has an array of places
  });

  // .save() does all the work for us to add new object into DB, also gives object unique ID, also is a promise
  try {
    await newUser.save();
  } catch (err) {
    const saveError = new HttpError("Sign Up Failed, SECOND", 500);
    return next(saveError);
  }

  let token;

  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      `${process.env.JWT_KEY}`,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const tokenError = new HttpError("Sign Up Failed, THIRD", 500);
    return next(tokenError);
  }

  console.log("mongooseID: " + newUser.id);
  // response
  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};

/*
 * * * * * * * * * * * * * * * * * * * POST for LOGIN  * * * * * * * * * * * * * * * * * * * * *
 */
const login = async (req, res, next) => {
  // pulling info from body
  const { email, password } = req.body;

  // variable to store duplicate user (if any)
  let existingUser;

  // searches DB for existing email
  try {
    existingUser = await User.findOne({ email: email }); // searches for provided email in DB
  } catch (err) {
    const loginError = new HttpError("Login failed", 500);
    return next(loginError);
  }

  // authentication checking, email and password must be valid
  if (!existingUser) {
    const authenticationError = new HttpError("Authentication failed", 403);
    return next(authenticationError);
  }

  let isValidPassword = false;

  // bcrypt.compare() compares the plain text password to the hashed version
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, credentials invalid",
      500
    );
    return next(error);
  }

  // checks if the password is valid after bcrypt()
  if (!isValidPassword) {
    const authenticationError = new HttpError("Authentication failed", 403);
    return next(authenticationError);
  }

  let token;

  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const tokenError = new HttpError("Login Failed", 500);
    return next(tokenError);
  }

  // otherwise, successful login
  res.status(200).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

exports.getAllUsers = getAllUsers;
exports.login = login;
exports.signUp = signUp;
