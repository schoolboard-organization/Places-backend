/*
 * ERROR CLASS to throw when errors arise
 */
class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); // adds message prop
    this.code = errorCode; // adds code prop
  }
}

module.exports = HttpError;
