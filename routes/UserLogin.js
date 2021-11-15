//jshint esversion:6
require("dotenv").config();
// const sanitize = require('mongo-sanitize');
const User = require('../model/user');
const multer = require('multer');

var storage = multer.diskStorage({
  destination: function(req, file, callback) {
    if (file.mimetype === 'application/pdf') {
      callback(null, './uploads');
    } else {
      callback(new Error('file type not supported'), false);
    }
  },
  filename: function(req, file, callback) {
    if (file.mimetype === 'application/pdf') {
      callback(null, file.fieldname + '-' + Date.now() + '.pdf');
    } else {
      callback(new Error('file type not supported'), false);
    }
  }
});
var upload = multer({
  storage: storage
});

module.exports = function(app, passport) {
  app.get('/', function(req, res) {
    res.render('index.ejs', {
      user: req.user
    });
    // res.redirect('/upload')
  });

  app.get('/login', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('login', {
      message: req.flash('loginMessage')
    });
  });

  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/upload', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  app.get('/signup', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('signup', {
      message: req.flash('signupMessage')
    });
  });

  app.post('/signup', upload.single('resume'), passport.authenticate('local-signup', {
    successRedirect: '/upload', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // app.get('/verify', function(req, res) {
  //   User.findOne({
  //     Email: req.user.Email,
  //   }, function(err, user) {
  //     if (user.isVerified) {
  //       if (user.isEmployer) {
  //         res.redirect('/profile/employer');
  //       } else if (user.isStudent) {
  //         res.redirect('/profile/student');
  //       } else if (user.isTrainer) {
  //         res.redirect('/profile/trainer');
  //       }
  //     } else {
  //       res.render('verify', {
  //         user: req.user // get the user out of session and pass to template
  //       });
  //     }
  //   });
  // });

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  // the callback after google has authenticated the user
  app.get('/auth/google/portfolio',
    passport.authenticate('google', {
      successRedirect:'/upload',
      failureRedirect: '/login-stud'
    }));

  // app.get('/profile', isLoggedIn, function(req, res) {
  //   User.findOne({
  //     _id: req.user._id
  //   }, function(err, user) {
  //     res.render('upload',{
  //       user:user
  //     });
  //   });
  // });

  function isLoggedIn(req, res, next) {
    try {
      if (req.isAuthenticated()) {
        req.isLogged = true;
        return next();
      }
      res.redirect('/');
    } catch (e) {
      console.log(e);
    }
  }
};
