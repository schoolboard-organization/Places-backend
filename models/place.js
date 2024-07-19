// imports
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
 * mongoose place_schema object:
 * - data represents a 'place'
 * - everything is required
 */
const place_schema = new Schema({
  title: { type: String, required: true },

  description: { type: String, required: true },
  imageURL: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },

  // each places has to belong to only one 'User'
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

// export schema as "Place"
module.exports = mongoose.model("Place", place_schema);
