const passport = require("passport");
const restaurantModel = require("../models/restaurant-model");
const GoogleStratergy = require("passport-google-oauth20").Strategy;
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { default: slugify } = require("slugify");

const randomString = crypto.randomBytes(30).toString("hex");

passport.use(
  new GoogleStratergy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3333/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let hashedString = await bcrypt.hash(randomString, 10);
        let user = await restaurantModel.findOne({
          email: profile.emails[0].value,
        });

        if (!user) {
          let newUser = await restaurantModel.create({
            email: profile.emails[0].value,
            ownerName: profile.displayName,
            password: hashedString,
            restaurantName: profile.displayName,
            authProvider: "google",
            slug: `${slugify(profile.displayName)}'s Restaurant`,
          });
          return done(null, newUser);
        }

        if (!user.ownerProfileImage && profile.photos?.[0]?.value) {
          user.ownerProfileImage = profile.photos[0].value;
          await user.save(); // update the user directly
        }
        if (!user.authProvider) {
          user.authProvider = "google";
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.log(err);
        return done(null, err);
      }
    }
  )
);
