const mongoose = require("mongoose");

const snapshotItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true }
  },
  { _id: false }
);

const paymentTransactionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    paymentId: { type: String, default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, default: "open" },
    paymentStatus: { type: String, default: "unpaid" },
    metadata: { type: Map, of: String, default: {} },
    cartSnapshot: { type: [snapshotItemSchema], required: true },
    orderCreated: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
