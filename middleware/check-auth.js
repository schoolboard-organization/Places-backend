const HttpError = require("../models/http-error");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  try {
    // grabs token from header, (Authorization: 'Bearer TOKEN'), split at white space
    const token = req.headers.authorization.split(" ")[1];

    // if there is no token throw error
    if (!token) {
      throw new Error("Authentication Failed, FIRST");
    }
    // decodes token
    const decodedToken = jwt.verify(token, `${process.env.JWT_KEY}`);

    // sets the userData to be userId from decoded token
    req.userData = { userId: decodedToken.userId };

    next();
  } catch (err) {
    const error = new HttpError("Authentication failed, SECOND", 401);
    return next(error);
  }
};
