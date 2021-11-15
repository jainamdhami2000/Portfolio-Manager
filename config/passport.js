//jshint esversion:6

const localStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const sanitize = require('mongo-sanitize');
const User = require('../model/user');
const configAuth = require('./auth');

module.exports = function(passport) {

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use('local-signup', new localStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, email, password, done) {

      process.nextTick(function() {
        const username = sanitize(req.body.username);
        User.findOne({
          'Email': email,
        }, function(err, user) {
          if (err)
            return done(err);
          if (user) {
            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
          } else {
            var newUser = new User();
            newUser.Email = email;
            newUser.username = username;
            newUser.local.password = newUser.generateHash(password);
            console.log(password)
            console.log(newUser.local.password)
            newUser.loginType = 'local';
            newUser.save(function(err) {
              if (err)
                throw err;
              return done(null, newUser);
            });
          }
        });
      });
    }));

  passport.use('local-login', new localStrategy({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    },
    function(req, email, password, done) {
      User.findOne({
        'Email': email,
      }, function(err, user) {
        if (err)
          return done(err);

        if (!user)
          return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

        if (!user.validPassword(password))
          return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata
        var U = new User();
        console.log(password)
        console.log(U.generateHash(password))
        return done(null, user);
      });
    }));

  passport.use(new GoogleStrategy({
      clientID: configAuth.googleAuth.clientID,
      clientSecret: configAuth.googleAuth.clientSecret,
      callbackURL: configAuth.googleAuth.callbackURL,
      passReqToCallback: true
    },
    function(req, token, refreshToken, profile, done) {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(function() {
        // try to find the user based on their google id
        User.findOne({
          'google.id': profile.id
        }, function(err, user) {
          if (err)
            return done(err);
          if (user) {
            // if a user is found, log them in
            return done(null, user, req.flash('message', 'Login'));
          } else {
            // if the user isnt in our database, create a new user
            var newUser = new User();
            // set all of the relevant information
            newUser.google.id = profile.id;
            newUser.google.token = token;
            // newUser.FirstName = profile.name.givenName;
            // newUser.LastName = profile.name.familyName;
            newUser.Email = profile.emails[0].value; // pull the first email
            newUser.username = profile.emails[0].value.substr(0, profile.emails[0].value.indexOf('@'));
            newUser.loginType = 'google';
            // save the user
            newUser.save(function(err) {
              if (err)
                throw err;
              return done(null, newUser, req.flash('message', 'Signup'));
            });
          }
        });
      });
    }));
};
