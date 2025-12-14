const express = require("express");
const router = express.Router();

// Payment Success Page
router.get("/payment-success", (req, res) => {
    res.render("payment-success"); // no need to pass `user`, res.locals handles it
});

// Payment Failed Page
router.get("/payment-failed", (req, res) => {
    res.render("payment-failed");
});

module.exports = router;
