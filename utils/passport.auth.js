const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user.model');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        // Username/email does NOT exist
        if (!user) {
          return done(null, false, {
            message: 'Username/email not registered',
          });
        }

        // Ensure `isValidPassword` exists and is a valid function
        if (typeof user.isValidPassword !== 'function') {
            throw new Error('isValidPassword is not a function');
          }

        // Email exist and now we need to verify the password
        const isMatch = await user.isValidPassword(password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect password' });
          }
  
          return done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
    if (!user || !user.id) {
      return done(new Error('Cannot serialize user'));
    }
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        return done(new Error('User not found'));
      }
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  