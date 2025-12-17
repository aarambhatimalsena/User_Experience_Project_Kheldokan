// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderItem",
        required: true,
      },
    ],
    deliveryAddress: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    couponCode: {
      type: String,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "Processing",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String, // "COD" | "eSewa" | "Khalti"
    },

    // 🔐 Integrity + security metadata (already used in controller)
    integrityHash: {
      type: String,
      default: null,
    },
    createdIp: {
      type: String,
      default: null,
    },
    createdUserAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
