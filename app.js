var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var logger = require('morgan');
var mongoose = require('mongoose');

var app = express();

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/selling', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('DB Connection Error:', err));

// Models
const Cart = require("./models/Cart");

// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session Setup
app.use(session({
  secret: 'secretKey123',
  resave: false,
  saveUninitialized: false
}));

// ✅ Global middleware to pass user & cartCount to EJS
app.use(async (req, res, next) => {
    res.locals.user = req.session.user || null;

    if (req.session.user) {
        const cart = await Cart.findOne({ userId: req.session.user._id });
        res.locals.cartCount = cart ? cart.products.length : 0;
    } else {
        res.locals.cartCount = 0;
    }

    next();
});

// Routes (after session & middlewares)
const indexRouter = require('./routes/index');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentStatusRoutes = require("./routes/paymentStatusRoutes");

app.use('/', indexRouter);
app.use('/', productRoutes);
app.use('/', cartRoutes);
app.use('/', paymentRoutes);
app.use('/', orderRoutes);
app.use('/', paymentStatusRoutes);

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
