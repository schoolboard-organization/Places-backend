/* ------------------------------------------
 * File Contains:
 * 1. GET which returns a place given a PLACE ID as a search parameter
 * 2. GET which returns all places associated with a given USER ID 
 * 3. POST which allows users to create new places
 * 4. PATCH which allows users to update the title and description of a previously created place
 * 5. DELETE which deletes a previously created place given that places ID
 ------------------------------------------ */
const HttpError = require("../models/http-error");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const mongoose = require("mongoose");
// custom models
const Place = require("../models/place");
const User = require("../models/user");

/*
 * * * * * * * * * * * * * * * * * GET for specific place with given place ID * * * * * * * * * * * * * * * * * * * * *
 */
const getPlaceById = async (req, res, next) => {
  // grabs :placeID in the URL
  const placeID = req.params.placeID;

  // variable to store place we are searching for
  let place;

  // .findById() searches for place
  try {
    place = await Place.findById(placeID);
  } catch (err) {
    const error = new HttpError("Didn't work. Place not found", 500); // error from pulling from DB
    return next(error); // return next() because function is asynchronous
  }

  // error checking, if place cant be found
  if (!place) {
    const error = new HttpError("Could not find place", 404);
    return next(error);
  }

  // .toObject() turns place into regular object, getters: true adds id property without underscore
  res.json({ place: place.toObject({ getters: true }) });
};

/*
 * * * * * * * * * * * * * * * * * * * GET for all places given specific user ID * * * * * * * * * * * * * * * * * * * * *
 */
const getPlacesByUserId = async (req, res, next) => {
  // grabs :userID from the URL
  const userID = req.params.userID;

  // variable to store all places given user ID
  let allPlaces;

  // uses .find() to final all places associated with given userID
  try {
    allPlaces = await Place.find({ creator: userID }); // finds places using userID as condition
  } catch {
    const error = new HttpError("Didn't work.", 500); // error from DB
    return next(error);
  }

  // if there are no places given the userID, send 404 error and message
  if (!allPlaces || allPlaces.length === 0) {
    return next(new HttpError("Could not find places given the userID", 404));
  }

  // display results
  res.status(200).json({
    allPlaces: allPlaces.map((place) => place.toObject({ getters: true })), // allows id parameter to not have an underscore
  });
};

/*
 * * * * * * * * * * * * * * * * * * * * * * POST for creating a new place * * * * * * * * * * * * * * * * * * * * *
 */
const createPlace = async (req, res, next) => {
  // looks into req object and checks for errors which we specified
  const errors = validationResult(req);

  // checks for 422 error: unprocessable errors, i.e invalid fields
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs, double check fields.", 422));
  }

  // object destructuring from the request
  const { title, description, address } = req.body;

  // tries using google API to turn address into coordinates
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (err) {
    return next(err);
  }

  // if code gets to this point, coordinates have been found, create new mongoose object
  const newPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    imageURL: req.file.path,
    creator: req.userData.userId,
  });

  // variable that will store the creator of the new place that was just made
  let creatorOfNewPlace;

  try {
    creatorOfNewPlace = await User.findById(req.userData.userId);
  } catch (error) {
    const err = new HttpError("Creating place failed", 500);
    return next(err);
  }

  if (!creatorOfNewPlace) {
    const err = new HttpError("Creator not valid", 404);
    return next(err);
  }

  try {
    // starts session
    const session = await mongoose.startSession();

    // start transaction using session
    session.startTransaction();

    // saves newly created place
    await newPlace.save({ session: session });

    // links newly created place with its creator
    creatorOfNewPlace.places.push(newPlace);

    // saves changes made to user who created new place
    await creatorOfNewPlace.save({ session: session });

    // commits transaction IFF all operations were successful
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError("Error in session/transaction", 500);
    return next(error);
  }

  // response, logs the created place
  res.status(201).json({ createdPlace: newPlace });
};

/*
 * * * * * * * * * * * * * * * * * * * * * PATCH for updating place by place id * * * * * * * * * * * * * * * * * * * * *
 */
const patchPlaceByPlaceId = async (req, res, next) => {
  // looks into req object and checks for errors which we specified
  const errors = validationResult(req);

  // 422 error: unprocessable errors for invalid inputs
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid update attempt, double check fields.", 422)
    );
  }

  // grabbed place id from URL
  const placeToBePatched = req.params.placeID;

  // object destructuring from the request
  const { title, description } = req.body;

  // variable to store the newly updated place
  let updatedPlace;

  // uses .findByIdAndUpdate() to find the appropriate place to patch and update it
  try {
    updatedPlace = await Place.findByIdAndUpdate(placeToBePatched, {
      title: title,
      description: description,
    });
  } catch (err) {
    const error = new HttpError("Couldn't patch place", 500); // catch error
    return next(error);
  }

  // security for backend token verification
  if (updatedPlace.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "Access Denied, SECURITYYYYY (we'll find you)",
      401
    ); // catch error
    return next(error);
  }

  res
    .status(200)
    .json({ updatedPlace: updatedPlace.toObject({ getters: true }) }); // makes id without an underscore
};

/*
 * * * * * * * * * * * * * * * * * * DELETE for deleting place by place id * * * * * * * * * * * * * * * * * * * * *
 */
const deletePlaceByPlaceId = async (req, res, next) => {
  // grabs the placeID from URL
  const deletedPlaceId = req.params.placeID;

  // variable to store the ID of the place we will delete
  let placeToBeDeleted;

  try {
    /* - finds the place to be deleted
     * - .populate('creator') returns the entire object instead of just the ID of the creator
     */
    placeToBeDeleted = await Place.findById(deletedPlaceId).populate("creator");

    // if there is no place with such ID, then throw error
    if (!placeToBeDeleted) {
      return next(
        new HttpError("Couldn't find place to be deleted (first one)", 404)
      );
    }
  } catch (err) {
    return next(new HttpError("Couldn't find place to be deleted", 404));
  }

  // security for backend token verification
  if (placeToBeDeleted.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "Access Denied, SECURITYYYYY (we'll find you)",
      401
    ); // catch error
    return next(error);
  }

  // grabs image URL of the place to be deleted
  const imagePath = placeToBeDeleted.imageURL;

  /*
   * Session/Transaction logic for:
   * 1. Deleting place
   * 2. Removing place ID from creator array
   */
  try {
    // starts session
    const session = await mongoose.startSession();

    // start transaction using session
    session.startTransaction();

    // delete the place we want to delete
    await placeToBeDeleted.deleteOne({ session: session });

    // delete/pull the ID of the deleted place from its creators array
    placeToBeDeleted.creator.places.pull(placeToBeDeleted);

    // saves changes made to the creator of the place we just deleted
    await placeToBeDeleted.creator.save({ session: session });

    // commits transaction IFF all operations were successful
    await session.commitTransaction();

    console.log("SUCCESSFUL DELETE OF PLACE");
  } catch (err) {
    return next(
      new HttpError("Error while in session/transaction for deleting", 500)
    );
  }

  // deleting image after place is deleted
  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  // response with additional id field without underscore
  res
    .status(200)
    .json({ placeToBeDeleted: placeToBeDeleted.toObject({ getters: true }) });
};

// exporting ALL FUNCTIONS
exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.patchPlaceByPlaceId = patchPlaceByPlaceId;
exports.deletePlaceByPlaceId = deletePlaceByPlaceId;
