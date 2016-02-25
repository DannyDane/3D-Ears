var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mongoose = require('mongoose');
var nodemailer = require('nodemailer');
var User = require('./models/user');
var routes = require('./routes/index');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');
var flash = require('express-flash');
var handlebars = require('express-handlebars');
var app = express();
mongoose.connect('mongodb://DannyDane:grimreever@ds059215.mongolab.com:59215/3dears');


passport.use(new LocalStrategy({usernameField: 'email'}, function(username, password, done) {
  User.findOne({ email: username }, function(err, user) {
    if (err) return done(err);
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    user.comparePassword(password, function(err, isMatch) {
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password.' });
      }
    });
  });
}));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Middleware
app.set('port', process.env.PORT || 3000);
app.engine('handlebars', handlebars({defaultLayout: 'main'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
  secret: 'session secret key', 
  saveUninitialized: true, 
  resave:true,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', routes)



app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});