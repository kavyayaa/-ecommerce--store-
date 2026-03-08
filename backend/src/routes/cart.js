const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const buildCartResponse = (cart) => {
  const items = cart.items.map((item) => ({
    productId: item.product._id,
    name: item.product.name,
    image: item.product.image,
    price: item.product.price,
    quantity: item.quantity,
    subtotal: Number((item.product.price * item.quantity).toFixed(2))
  }));

  const totalAmount = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
  return { items, totalAmount };
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate("items.product");
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
    cart = await Cart.findOne({ user: userId }).populate("items.product");
  }
  return cart;
};

router.get("/", requireAuth, async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    return res.json(buildCartResponse(cart));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch cart", error: error.message });
  }
});

router.post("/add", requireAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Math.max(1, Number(quantity || 1));

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const cart = await getOrCreateCart(req.user.id);
    const index = cart.items.findIndex((item) => item.product._id.toString() === productId);
    if (index >= 0) {
      cart.items[index].quantity += qty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    const updated = await Cart.findOne({ user: req.user.id }).populate("items.product");
    return res.json({ message: "Added to cart", ...buildCartResponse(updated) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add to cart", error: error.message });
  }
});

router.put("/update", requireAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity || 1);
    if (qty < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.find((entry) => entry.product._id.toString() === productId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    item.quantity = qty;
    await cart.save();
    const updated = await Cart.findOne({ user: req.user.id }).populate("items.product");
    return res.json({ message: "Cart updated", ...buildCartResponse(updated) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update cart", error: error.message });
  }
});

router.post("/remove", requireAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    const cart = await getOrCreateCart(req.user.id);
    cart.items = cart.items.filter((item) => item.product._id.toString() !== productId);
    await cart.save();
    const updated = await Cart.findOne({ user: req.user.id }).populate("items.product");
    return res.json({ message: "Removed from cart", ...buildCartResponse(updated) });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove from cart", error: error.message });
  }
});

router.delete("/clear", requireAuth, async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user.id }, { $set: { items: [] } }, { upsert: true });
    return res.json({ message: "Cart cleared", items: [], totalAmount: 0 });
  } catch (error) {
    return res.status(500).json({ message: "Failed to clear cart", error: error.message });
  }
});

module.exports = router;
