const express = require("express");
const Stripe = require("stripe");
const { requireAuth } = require("../middleware/auth");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const PaymentTransaction = require("../models/PaymentTransaction");

const router = express.Router();

const stripeApiKey = process.env.STRIPE_API_KEY;
if (!stripeApiKey) {
  throw new Error("Missing STRIPE_API_KEY in backend/.env");
}
const stripe = new Stripe(stripeApiKey);

const safeOrigin = (originUrl) => {
  if (!originUrl || typeof originUrl !== "string") {
    return null;
  }
  if (!originUrl.startsWith("http://") && !originUrl.startsWith("https://")) {
    return null;
  }
  return originUrl.replace(/\/$/, "");
};

const getCartWithProducts = async (userId) =>
  Cart.findOne({ user: userId }).populate("items.product");

router.post("/session", requireAuth, async (req, res) => {
  try {
    const originUrl = safeOrigin(req.body.originUrl);
    if (!originUrl) {
      return res.status(400).json({ message: "Valid originUrl is required" });
    }

    const cart = await getCartWithProducts(req.user.id);
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const lineItems = cart.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.product.name,
          images: [item.product.image]
        },
        unit_amount: Math.round(Number(item.product.price) * 100)
      },
      quantity: item.quantity
    }));

    const amount = Number(
      cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0).toFixed(2)
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${originUrl}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${originUrl}/cart.html`,
      metadata: {
        userId: req.user.id,
        userEmail: req.user.email
      }
    });

    const cartSnapshot = cart.items.map((item) => ({
      productId: item.product._id,
      name: item.product.name,
      image: item.product.image,
      price: Number(item.product.price),
      quantity: item.quantity
    }));

    await PaymentTransaction.create({
      sessionId: session.id,
      paymentId: session.payment_intent || null,
      user: req.user.id,
      userEmail: req.user.email,
      amount,
      currency: "usd",
      metadata: {
        source: "checkout_session"
      },
      status: session.status,
      paymentStatus: session.payment_status,
      cartSnapshot
    });

    return res.status(201).json({
      url: session.url,
      sessionId: session.id
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create checkout session", error: error.message });
  }
});

router.get("/status/:sessionId", requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const tx = await PaymentTransaction.findOne({ sessionId, user: req.user.id });
    if (!tx) {
      return res.status(404).json({ message: "Payment transaction not found" });
    }

    tx.status = session.status;
    tx.paymentStatus = session.payment_status;
    tx.paymentId = session.payment_intent || tx.paymentId;

    if (session.payment_status === "paid" && !tx.orderCreated) {
      await Order.create({
        user: req.user.id,
        items: tx.cartSnapshot,
        totalAmount: tx.amount,
        status: "paid",
        paymentSessionId: session.id
      });

      await Cart.findOneAndUpdate({ user: req.user.id }, { $set: { items: [] } });
      tx.orderCreated = true;
      tx.status = "complete";
    }

    await tx.save();

    return res.json({
      status: tx.status,
      payment_status: tx.paymentStatus,
      amount_total: Math.round(tx.amount * 100),
      currency: tx.currency,
      metadata: Object.fromEntries(tx.metadata || []),
      order_created: tx.orderCreated
    });
  } catch (error) {
  console.error("CHECKOUT ERROR:", error);
  return res.status(500).json({ message: "Failed to create checkout session", error: error.message });
}
});

const handleStripeWebhook = async (req, res) => {
  try {
    const signature = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    if (secret && signature) {
      event = stripe.webhooks.constructEvent(req.body, signature, secret);
    } else {
      event = JSON.parse(req.body.toString());
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await PaymentTransaction.findOneAndUpdate(
        { sessionId: session.id },
        {
          $set: {
            paymentStatus: session.payment_status,
            status: "complete",
            paymentId: session.payment_intent || null
          }
        }
      );
    }

    return res.json({ received: true });
  } catch (error) {
    return res.status(400).json({ message: "Webhook error", error: error.message });
  }
};

module.exports = { checkoutRouter: router, handleStripeWebhook };