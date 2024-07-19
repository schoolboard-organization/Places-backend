/* imports */
const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users-controllers");
const fileUpload = require("../middleware/file-upload");
const { check } = require("express-validator");

/*
 * GET for retrieving all users
 */
router.get("/", usersController.getAllUsers);

/*
 * POST for user SIGN UP functionality
 */
router.post(
  "/signup",
  fileUpload.single("image"), // for the image uploaded by users signing up
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  usersController.signUp
);

/*
 * POST for user LOGIN functionality
 */
router.post("/login", usersController.login);

// export
module.exports = router;
