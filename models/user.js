// imports
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const unique_validator = require("mongoose-unique-validator");

/*
 * mongoose user_schema object:
 * - data represents a unique user
 * - everything is required
 */
const user_schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // unique speeds up querying
  password: { type: String, required: true, minlength: 6 },
  imageURL: { type: String, required: true },

  // each user can have multiple 'Place's
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }],
});

// makes sure each user has a unique email
user_schema.plugin(unique_validator);

// export schema as "User"
module.exports = mongoose.model("User", user_schema);
