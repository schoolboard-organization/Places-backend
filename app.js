// other imports
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const HttpError = require("./models/http-error");
const fs = require("fs");

// import mongoose to use DB
const mongoose = require("mongoose");
const DB_URL = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.p6s9frw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

// imported our routers we made
const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");

// uses express
const app = express();

// body parser so we don't have to do it manually
app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

// for CORS error
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});

// requests for PLACES must START with /api/places
app.use("/api/places", placesRoutes);

// requests for USERS must START with /api/users
app.use("/api/users", usersRoutes);

// only reached when a request doesn't get a response from any other middleware
app.use((req, res, next) => {
  const error = new HttpError("Couldn't find this route", 404);
  throw error;
});

// SPECIAL middleware function for ERRORS, if any middleware above send an error, this is called
app.use((error, req, res, next) => {
  // deletes image if error was encountered
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "Unknown error" });
});

// DB connection and server starting
mongoose
  .connect(DB_URL) // connects to DB using URL
  .then(() => {
    console.log("CONNECTED TO DATABASE");
    app.listen(process.env.PORT || 5000); // if connection is established, start server
  })
  .catch((error) => {
    console.log(error);
  });
