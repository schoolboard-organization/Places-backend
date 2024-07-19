const axios = require("axios"); // third party library
const HttpError = require("../models/http-error");
const API_KEY = process.env.GOOGLE_API_KEY; // google API key

/*
 * * * FUNCTION for turning addresses into coordinates
 */
async function getCoordsForAddress(address) {
  // uses axios and api URL and key to get response
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  // grabs data from response
  const data = response.data;

  // checks that data is valid
  if (!data || data.status === "ZERO_RESULTS") {
    throw new HttpError("ADDRESS NOT FOUND", 422);
  }

  // if data is valid, grab coordinates from data object and return
  const coordinates = data.results[0].geometry.location;
  return coordinates;
}

module.exports = getCoordsForAddress;
