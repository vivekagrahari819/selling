const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Middleware to check admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.redirect('/login');
}

// Middleware to check user
function isUser(req, res, next) {
  if (req.session.user && req.session.user.role === 'user') {
    return next();
  }
  res.redirect('/login');
}

// SHOW ALL PRODUCTS (Both user & admin)
router.get('/products', async (req, res) => {
  const products = await Product.find();
  res.render("products", {
    products,
    user: req.session.user
  });
});

// ADMIN — ADD PRODUCT FORM
router.get('/admin/product/add', isAdmin, (req, res) => {
  res.render("adminAddProduct", {
    message: "",
    messageType: ""
  });
});

// ADMIN — SAVE PRODUCT
router.post('/admin/product/add', isAdmin, async (req, res) => {
  try {
    const { name, price, description, image } = req.body;

    const product = new Product({ name, price, description, image });
    await product.save();

    res.render("adminAddProduct", {
      message: "Product Added Successfully",
      messageType: "success"
    });

  } catch (error) {
    console.error(error);
    res.render("adminAddProduct", {
      message: "Error adding product",
      messageType: "error"
    });
  }
});

// ADMIN — EDIT FORM
router.get('/admin/product/edit/:id', isAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.render('adminEditProduct', { product });
});

// ADMIN — UPDATE
router.post('/admin/product/update/:id', isAdmin, async (req, res) => {
  const { name, price, description, image } = req.body;

  await Product.findByIdAndUpdate(req.params.id, {
    name, price, description, image
  });

  res.redirect('/products');
});

// ADMIN — DELETE
router.get('/admin/product/delete/:id', isAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect('/products');
});

module.exports = router;
