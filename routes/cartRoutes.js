const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// USER AUTH
function isUser(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect("/login");
}

// ADD TO CART
router.post("/cart/add/:id", isUser, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const productId = req.params.id;
        const quantity = parseInt(req.body.quantity) || 1;

        const product = await Product.findById(productId);
        if (!product) return res.send("Product not found");

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId,
                products: []
            });
        }

        const itemIndex = cart.products.findIndex(
            p => p.productId.toString() === productId
        );

        if (itemIndex > -1) {
            cart.products[itemIndex].quantity += quantity;
        } else {
            cart.products.push({ productId, quantity });
        }

        await cart.save();
        res.redirect("/cart");

    } catch (err) {
        console.log(err);
        res.status(500).send("Add to cart error");
    }
});



router.post("/cart/increase/:id", async (req, res) => {
    const userId = req.session.user._id;
    const productId = req.params.id;

    await Cart.updateOne(
        { userId, "products.productId": productId },
        { $inc: { "products.$.quantity": 1 } }
    );

    res.redirect("/cart");
});


router.post("/cart/decrease/:id", async (req, res) => {
    const userId = req.session.user._id;
    const productId = req.params.id;

    const cart = await Cart.findOne({ userId });

    const item = cart.products.find(
        p => p.productId.toString() === productId
    );

    if (item.quantity > 1) {
        item.quantity -= 1;
        await cart.save();
    }

    res.redirect("/cart");
});



router.post("/cart/remove/:id", async (req, res) => {
    const userId = req.session.user._id;
    const productId = req.params.id;

    await Cart.updateOne(
        { userId },
        { $pull: { products: { productId } } }
    );

    res.redirect("/cart");
});



// CHECKOUT PAGE
router.get("/checkout", async (req, res) => {
    try {
        const userId = req.session.user._id;

        const cart = await Cart.findOne({ userId })
            .populate("products.productId");

        if (!cart || cart.products.length === 0) {
            return res.redirect("/cart");
        }

        // Calculate total
        let totalAmount = 0;
        cart.products.forEach(item => {
            totalAmount += item.productId.price * item.quantity;
        });

        res.render("checkout", {
            cart,
            totalAmount
        });

    } catch (err) {
        console.log(err);
        res.status(500).send("Checkout error");
    }
});





// VIEW CART
router.get("/cart", isUser, async (req, res) => {
    try {
        const userId = req.session.user._id;

        const cart = await Cart.findOne({ userId })
            .populate("products.productId");

        res.render("cart", { cart });
    } catch (err) {
        console.log(err);
        res.status(500).send("Cart load error");
    }
});

module.exports = router;
