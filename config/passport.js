// Importing required modules and dependencies
import { Strategy as LocalStrategy } from 'passport-local';
import Customer from '../models/Customer.js';

// Exporting a function to configure Passport authentication
export default function(passport) {
  // Configuring Passport to use LocalStrategy for authentication
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      // Finding a customer by username in the database
      const user = await Customer.findOne({ username });
      // If no user found, return with error message
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      // Comparing the provided password with the stored password
      user.comparePassword(password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          // If passwords match, return the user object
          return done(null, user);
        } else {
          // If passwords do not match, return with error message
          return done(null, false, { message: 'Incorrect password.' });
        }
      });
    } catch (error) {
      // Handling errors if any occurred during authentication process
      return done(error);
    }
  }));

  // Serializing user object to store in session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserializing user object from session
  passport.deserializeUser(async (id, done) => {
    try {
      // Finding a user by id in the database
      const user = await Customer.findById(id);
      done(null, user);
    } catch (error) {
      // Handling errors if any occurred during deserialization
      done(error, null);
    }
  });
}
