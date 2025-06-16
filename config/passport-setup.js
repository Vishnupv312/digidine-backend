const passport = require("passport");
const restaurantModel = require("../models/restaurant-model");
const GoogleStratergy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const randomString = crypto.randomBytes(30);

passport.use(
  new GoogleStratergy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3333/api/auth/google/callback",
    },
    async (request, profile) => {
      let user = restaurantModel.findOne({
        email: profile.emails[0].value,
      });
      if (!user) {
        restaurantModel.create({
          email: profile.emails[0].value,
          ownerName: profile.displayName,
          password: bcrypt.hash(randomString, 10),
        });
      }

      console.log("request while setting up passport js ", request, profile);
    }
  )
);
