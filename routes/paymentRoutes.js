const express = require("express");
const router = express.Router();
const razorpay = require("../config/razorpay");
const Cart = require("../models/Cart");
const Order = require("../models/Order");


function isUser(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ error: "Login required" });
}


router.post("/payment-failed-log", async (req, res) => {
    console.log("Payment Failed:", req.body);
    res.json({ logged: true });
});




// CREATE ORDER
router.post("/create-order", isUser, async (req, res) => {
    const userId = req.session.user._id;

    const cart = await Cart.findOne({ userId })
        .populate("products.productId");

    if (!cart || cart.products.length === 0) {
        return res.status(400).json({ error: "Cart empty" });
    }

    let totalAmount = 0;
    cart.products.forEach(item => {
        totalAmount += item.productId.price * item.quantity;
    });

    const order = await razorpay.orders.create({
        amount: totalAmount * 100,
        currency: "INR",
        receipt: "order_" + Date.now()
    });

    res.json({
        orderId: order.id,
        amount: order.amount
    });
});

router.post("/verify-payment", isUser, async (req, res) => {
    const userId = req.session.user._id;
    const { razorpay_payment_id, razorpay_order_id } = req.body;

    const cart = await Cart.findOne({ userId })
        .populate("products.productId");

    const products = cart.products.map(item => ({
        productId: item.productId._id,
        name: item.productId.name,
        price: item.productId.price,
        quantity: item.quantity,
        image: item.productId.image
    }));

    const totalAmount = products.reduce(
        (sum, p) => sum + p.price * p.quantity,
        0
    );

    await Order.create({
        userId,
        products,
        totalAmount,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
    });

    await Cart.deleteOne({ userId });

    res.json({ success: true });
});


module.exports = router;
