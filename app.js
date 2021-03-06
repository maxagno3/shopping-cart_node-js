var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var passport = require('passport');
var session = require('express-session');
var auth = require('./middlewares/auth');

require('dotenv').config();
require('./modules/passport');

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var shoppingRouter = require('./routes/shopping');
var productRouter = require('./routes/products');

var app = express();

mongoose.connect(
  "mongodb://localhost/shopping",
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    console.log("Connected:", err ? false : true);
  }
  );
  
  // view engine setup
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "ejs");
  
  app.use(logger("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, "public")));
  
  app.use(
    session({
      secret: "keyboard cat", //to hash your cookie.
      resave: true, //whether to extend session duration.
      saveUninitialized: false, //to create a blank session before logging in.
    })
    );
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    app.use(auth.userInfo);
    app.use("/", indexRouter);
    app.use("/users", usersRouter);
    app.use(auth.checkLogged);
    app.use(auth.adminInfo);
    app.use('/shopping', shoppingRouter);
    app.use('/products', productRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
