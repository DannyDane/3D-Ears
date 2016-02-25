var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var async = require('async');
var crypto = require('crypto');
var passport = require('passport');
var User = require('../models/user');
var flash = require('express-flash');

// Routes
router.get('/', function(req, res) {
  res.render('index', { 
  	title: '',
    user: req.user
  });
});

router.get('/about', function(req, res) {
  res.render('about', { 
    title: 'About',
    user: req.user
  });
});


router.get('/sign_up', function(req, res) {
  res.render('sign_up', {
    user: req.user,
    title: 'Create Account'
  });
});

router.post('/sign_up', function(req, res) {
  var user = new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      
    });

  user.save(function(err) {
    req.logIn(user, function(err) {
      req.flash('error', 'Sign up successful!');
      return res.redirect('/exercises');
    });
  });
});

router.get('/sign_in', function(req, res) {
  res.render('sign_in', {
   	user: req.user,
   	title: 'Sign in'
  });
});

router.post('/sign_in', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) return next(err)
    if (!user) {
    	req.flash('error', 'Invalid username or password');
      return res.redirect('/sign_in')
    }
    req.logIn(user, function(err) {
      if (err) return next(err);
      req.flash('error', 'Sign in successful!');
      return res.redirect('/exercises');
    });
  })(req, res, next);
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

router.get('/forgot', function(req, res) {
  res.render('forgot', {
    title: 'Forgot Password',
    user: req.user
  });
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'gmail',
        auth: {
          user: 'fabian.coursdeguitare@gmail.com',
          pass: ''
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'fabian.coursdeguitare@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {
      user: req.user
    });
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'gmail',
        auth: {
          user: 'fabian.coursdeguitare@gmail.com',
          pass: ''
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'fabian.coursdeguitare@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

router.get('/payment', function(req, res) {
  res.render('payment', { 
  	title: 'Payment',
    user: req.user
  });
});

router.get('/pricing', function(req, res) {
  res.render('pricing', { 
    title: 'Pricing',
    css: 'pricing.css',
    user: req.user
  });
});



router.get('/exercises', function(req, res) {
  res.render('exercises', {
    user: req.user
  });
});

router.get('/exercises/eq', function(req, res) {
  res.render('eq', {
    user: req.user
  });
});

router.get('/exercises/compression', function(req, res) {
  res.render('compression', {
    user: req.user
  });
});

router.get('/exercises/reverb', function(req, res) {
  res.render('reverb', {
    user: req.user
  });
});

router.get('/exercises/eq/:level', loggedIn, function(req, res) {
  res.render('eq-basic', {
    user: req.user,
    css: 'exercise-template.css'
  });
});

router.get('/exercises/reverb/:level', function(req, res) {
  res.send('Reverb');
});

router.get('/exercises/compression/:level', loggedIn, function(req, res) {
  res.render('compression-basic', {
    user: req.user,
    css: 'exercise-template.css'
  });
});


function loggedIn (req, res, next) {
  if (req.user) {
    next();
  } else {
    req.flash('error', 'You need to sign up or sign in to view content');
    return res.redirect('back');
  }
}


module.exports = router;