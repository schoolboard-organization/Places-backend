/* imports */
const express = require("express");
const router = express.Router();
const placesControllers = require("../controllers/places-controllers");
const { check } = require("express-validator");
const fileUpload = require("../middleware/file-upload");
const checkAuth = require("../middleware/check-auth");
/*
 * GET for specific place with given place ID
 */
router.get("/:placeID", placesControllers.getPlaceById);

/*
 * GET for all places given specific user ID
 */
router.get("/user/:userID", placesControllers.getPlacesByUserId);

/*
 * TOKEN
 */
router.use(checkAuth);

/*
 * POST for creating new place (has validation via check())
 */
router.post(
  "/",
  fileUpload.single("image"), // for the image uploaded by users signing up
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

/*
 * PATCH for updating place given specific place ID (has validation via check())
 */
router.patch(
  "/:placeID",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.patchPlaceByPlaceId
);

/*
 * DELETE for deleting place given specific place ID
 */
router.delete("/:placeID", placesControllers.deletePlaceByPlaceId);

// export
module.exports = router;
