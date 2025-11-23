var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var logger = require('morgan');
var mongoose = require('mongoose');

var app = express(); // ✅ app must be defined BEFORE using routes

// Routes
const indexRouter = require('./routes/index');
const productRoutes = require('./routes/productRoutes');
// const usersRouter = require('./routes/users'); // use only if needed

// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/selling', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('DB Connection Error:', err));

// Session Setup
app.use(session({
  secret: 'secretKey123',
  resave: false,
  saveUninitialized: false
}));

// Make session user available in all EJS files
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});



// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/', productRoutes);
// app.use('/users', usersRouter); // only if you create this route

// 404 Handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error Handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
