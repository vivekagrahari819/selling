const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Middleware to check if user is logged in
function isUser(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect("/login"); // redirect to login if not logged in
}

// GET orders page
router.get("/orders", isUser, async (req, res) => {
    try {
        let orders;

        if (req.session.user.role === "admin") {
            // Admin sees all orders
            orders = await Order.find()
                .populate("userId")
                .populate("products.productId")
                .sort({ createdAt: -1 });
        } else {
            // Normal user sees only their orders
            orders = await Order.find({ userId: req.session.user._id })
                .populate("products.productId")
                .sort({ createdAt: -1 });
        }

        res.render("orders", { orders, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});


const PDFDocument = require("pdfkit");
const fs = require("fs");

// Route to download invoice
router.get("/orders/:id/invoice", isUser, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("userId")
            .populate("products.productId");

        if (!order) return res.status(404).send("Order not found");

        // Only admin or order owner can download
        if (req.session.user.role !== "admin" && !order.userId._id.equals(req.session.user._id)) {
            return res.status(403).send("Unauthorized");
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text("Invoice", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Order ID: ${order._id}`);
        doc.text(`Date: ${order.createdAt.toDateString()}`);
        doc.text(`User: ${order.userId.name} (${order.userId.email})`);
        doc.moveDown();

        order.products.forEach(item => {
            let product = item.productId;
            doc.text(`${product.name} - ₹${item.price} x ${item.quantity}`);
        });

        doc.moveDown();
        doc.text(`Total: ₹${order.totalAmount}`, { align: "right" });
        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});



module.exports = router;
