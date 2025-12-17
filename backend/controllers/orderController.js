// controllers/orderController.js
import path from "path";
import fs from "fs";
import mongoose from "mongoose";
import crypto from "crypto";

import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";

import { generateInvoice } from "../utils/invoiceGenerator.js";
import { sendOrderEmail } from "../utils/emailSender.js";
import { createNotification } from "./notificationController.js";

// =============================
// 🔐 Helpers: order integrity
// =============================

const computeIntegrityHash = ({
  userId,
  items,
  totalAmount,
  couponCode,
  discountAmount,
}) => {
  const secret =
    process.env.ORDER_INTEGRITY_SECRET || "fallback_order_integrity_secret";

  // sorted by productId for deterministic hash
  const sortedItems = [...items].sort((a, b) =>
    a.productId.localeCompare(b.productId)
  );

  const payload = JSON.stringify({
    userId: String(userId),
    items: sortedItems.map((i) => ({
      productId: String(i.productId),
      quantity: i.quantity,
      price: i.price,
    })),
    totalAmount,
    couponCode: couponCode || null,
    discountAmount: discountAmount || 0,
  });

  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
};

const buildItemsForIntegrityFromOrder = (order) => {
  return (order.items || []).map((item) => ({
    productId: item.product
      ? item.product._id
        ? item.product._id.toString()
        : item.product.toString()
      : null,
    quantity: item.quantity,
    price: item.price,
  }));
};

const verifyOrderIntegrityOrWarn = async (order) => {
  // For older orders without hash → skip check
  if (!order.integrityHash) return { ok: true, reason: "no_hash" };

  const itemsForHash = buildItemsForIntegrityFromOrder(order);

  const expectedHash = computeIntegrityHash({
    userId: order.user._id ? order.user._id.toString() : order.user.toString(),
    items: itemsForHash,
    totalAmount: order.totalAmount,
    couponCode: order.couponCode,
    discountAmount: order.discount,
  });

  if (expectedHash !== order.integrityHash) {
    console.error(
      "⚠️ Order integrity mismatch detected for order:",
      order._id.toString()
    );
    return { ok: false, reason: "mismatch" };
  }

  return { ok: true, reason: "match" };
};

// =============================
// 📦 PLACE ORDER
// =============================
export const placeOrder = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name;

    const ip = req.ip;
    const userAgent = req.headers["user-agent"];

    console.log("📦 placeOrder called for user:", userId);
    console.log("📦 Request body:", req.body);

    // 1) Get cart with products
    const cart = await Cart.findOne({
      user: new mongoose.Types.ObjectId(userId),
    }).populate({
      path: "items.product",
      model: "Product",
    });

    if (!cart || cart.items.length === 0) {
      console.log("🛒 Cart empty for user:", userId);
      return res.status(400).json({ message: "Your cart is empty" });
    }

    // 2) Body fields
    const { deliveryAddress, phone, paymentMethod, couponCode } = req.body;
    if (!deliveryAddress || !phone) {
      return res
        .status(400)
        .json({ message: "Delivery address and phone are required" });
    }

    // 3) Normalize items snapshot
    const normalizedItems = cart.items
      .filter((item) => item.product)
      .map((item) => ({
        productId: item.product._id.toString(),
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

    if (normalizedItems.length === 0) {
      return res.status(400).json({ message: "No valid products in cart" });
    }

    // 4) Calculate total (server-side)
    let totalAmount = normalizedItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    let discountAmount = 0;

    // 5) Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        isActive: true,
        expiresAt: { $gte: new Date() },
      });

      if (!coupon) {
        return res
          .status(400)
          .json({ message: "Invalid or expired coupon code" });
      }

      discountAmount = (totalAmount * coupon.discountPercentage) / 100;
      totalAmount -= discountAmount;
    }

    // 6) Compute integrity hash
    const integrityHash = computeIntegrityHash({
      userId,
      items: normalizedItems,
      totalAmount,
      couponCode,
      discountAmount,
    });

    const finalPaymentMethod = paymentMethod || "COD";

    // 7) Create base order
    //    👉 sabai lai initially unpaid rakheko (COD + eSewa + Khalti)
    const newOrder = new Order({
      user: userId,
      items: [],
      deliveryAddress,
      phone,
      totalAmount,
      paymentMethod: finalPaymentMethod,
      isPaid: false,
      paidAt: null,
      couponCode: couponCode || null,
      discount: discountAmount || 0,
      integrityHash,
      createdIp: ip || null,
      createdUserAgent: userAgent || null,
    });

    const savedOrder = await newOrder.save();
    console.log("✅ Order created:", savedOrder._id);

    // 8) Create order items
    const orderItemIds = [];
    for (const item of normalizedItems) {
      const orderItem = new OrderItem({
        order: savedOrder._id,
        product: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      });

      const savedItem = await orderItem.save();
      orderItemIds.push(savedItem._id);
    }

    savedOrder.items = orderItemIds;
    await savedOrder.save();
    console.log("✅ Order items attached");

    // 9) Clear cart
    await Cart.findOneAndDelete({
      user: new mongoose.Types.ObjectId(userId),
    });
    console.log("🧺 Cart cleared for user:", userId);

    // 🔔 Notification
    try {
      await createNotification({
        userId,
        message: `Your order #${savedOrder._id} has been placed successfully 🎉`,
        type: "order",
        link: `/orders/${savedOrder._id}`,
      });
      console.log("🔔 Order notification created for user:", userId);
    } catch (notifErr) {
      console.error("⚠️ Failed to create order notification:", notifErr);
    }

    // 10) Respond to client (frontend)
    res.status(201).json({
      message: "✅ Order placed successfully!",
      orderId: savedOrder._id,
      totalAmount,
      discount: discountAmount,
      couponCode: couponCode || null,
      createdAt: savedOrder.createdAt,
      updatedAt: savedOrder.updatedAt,
      isPaid: false,
      paymentMethod: finalPaymentMethod,
    });

    // 11) BACKGROUND: invoice + emails
    (async () => {
      try {
        const invoicePath = path.resolve(
          `invoices/invoice-${savedOrder._id}.pdf`
        );
        if (!fs.existsSync("invoices")) {
          fs.mkdirSync("invoices", { recursive: true });
        }

        const fullOrder = await Order.findById(savedOrder._id)
          .populate("user", "name email")
          .populate({
            path: "items",
            populate: {
              path: "product",
              model: "Product",
            },
          });

        await generateInvoice(fullOrder, invoicePath);

        const pm = fullOrder.paymentMethod || "COD";
        const isCod = pm === "COD";
        const orderLabel = `#${fullOrder._id}`;
        const safeName = fullOrder.user?.name || userName || "Customer";
        const safeEmail = fullOrder.user?.email || userEmail;

        // 11a) 📨 FIRST MAIL → ORDER CONFIRMED (all methods)
        const orderSubject = isCod
          ? `✅ Order Confirmed (Cash on Delivery) - Kheldokan`
          : `✅ Order Confirmed - Kheldokan`;

        const orderText = isCod
          ? `Dear ${safeName},\n\nYour order ${orderLabel} has been successfully placed with Cash on Delivery.\n\nPlease find the invoice attached. You can pay the amount when your order arrives.\n\nThank you for shopping with Kheldokan.\n\nRegards,\nKheldokan`
          : `Dear ${safeName},\n\nYour order ${orderLabel} has been successfully placed. We are now processing your ${pm} payment and will send you a separate confirmation once it is verified.\n\nPlease find the invoice attached for your records.\n\nThank you for shopping with Kheldokan.\n\nRegards,\nKheldokan`;

        await sendOrderEmail(safeEmail, orderSubject, orderText, invoicePath);
        console.log("📧 Order confirmation email sent:", savedOrder._id);

        // invoice file remove (optional)
        fs.unlink(invoicePath, () => {});

        // 11b) 📨 SECOND MAIL → ONLY for eSewa / Khalti (auto payment confirm)
        if (!isCod) {
          setTimeout(async () => {
            try {
              // update payment fields
              fullOrder.isPaid = true;
              fullOrder.paidAt = Date.now();
              await fullOrder.save();

              const paySubject = `✅ Payment Confirmed (${pm}) - Kheldokan`;
              const payText = `Dear ${safeName},\n\nYour payment via ${pm} for order ${orderLabel} has been CONFIRMED.\n\nPayment Status: SUCCESS\nPayment Method: ${pm}\n\nYour order is now fully confirmed and will be dispatched as per schedule.\n\nThank you for shopping with Kheldokan.\n\nRegards,\nKheldokan`;

              await sendOrderEmail(safeEmail, paySubject, payText, null);
              console.log(
                "📧 Online payment confirmed email sent:",
                fullOrder._id.toString()
              );
            } catch (e) {
              console.error("❌ Auto payment confirmation failed:", e);
            }
          }, 1500); // ~1.5 sec delay
        }
      } catch (invoiceErr) {
        console.error(
          "⚠️ Invoice/email error (order already placed, ignoring for client):",
          invoiceErr
        );
      }
    })();
  } catch (err) {
    console.error("❌ placeOrder fatal error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// =============================
// 📄 DOWNLOAD INVOICE
// =============================
export const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const requesterId = req.user.id || req.user._id;
    const requesterRole = req.user.role;

    const order = await Order.findById(orderId)
      .populate("user", "name email")
      .populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // ✅ Only owner or admin can download the invoice
    const isOwner = order.user._id.toString() === requesterId.toString();
    const isAdmin = requesterRole === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to download this invoice" });
    }

    const invoicePath = path.resolve(`invoices/invoice-${order._id}.pdf`);
    const dir = path.dirname(invoicePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await generateInvoice(order, invoicePath);

    res.download(invoicePath, (err) => {
      if (err) {
        console.error("❌ Error sending invoice:", err);
        return res.status(500).json({ message: "Failed to download invoice" });
      }
    });
  } catch (err) {
    console.error("❌ downloadInvoice error:", err);
    return res.status(500).json({ message: "Invoice error" });
  }
};

// =============================
// 👤 GET USER ORDERS
// =============================
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const orders = await Order.find({ user: userId })
      .populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      })
      .sort({ createdAt: -1 });

    if (orders.length === 0) {
      return res.status(404).json({ message: "No orders found" });
    }

    return res.status(200).json(orders);
  } catch (err) {
    console.error("❌ getUserOrders error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ✅ USER: GET ONE ORDER BY ID
export const getOrderByIdForUser = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const order = await Order.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    return res.status(200).json(order);
  } catch (err) {
    console.error("❌ getOrderByIdForUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// =============================
// 🛡️ ADMIN: GET ALL ORDERS
// =============================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      });

    return res.status(200).json(orders);
  } catch (err) {
    console.error("❌ getAllOrders error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// =============================
// 🛡️ ADMIN: GET ONE ORDER DETAIL
// =============================
export const getOrderByIdAdmin = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate("user", "name email")
      .populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Optional: integrity check, just for logging (not blocking)
    try {
      const integrityResult = await verifyOrderIntegrityOrWarn(order);
      if (!integrityResult.ok) {
        console.warn(
          "⚠️ Admin view: integrity mismatch for order",
          order._id.toString()
        );
      }
    } catch (e) {
      console.warn("⚠️ Integrity check failed (admin view):", e.message);
    }

    return res.status(200).json(order);
  } catch (err) {
    console.error("❌ getOrderByIdAdmin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// =============================
// 🛡️ ADMIN: UPDATE ORDER STATUS
// =============================
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const validStatuses = ["Processing", "Shipped", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(orderId)
      .populate("user", "name email")
      .populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // (Optional) integrity check before admin update
    const integrityResult = await verifyOrderIntegrityOrWarn(order);
    if (!integrityResult.ok) {
      return res.status(409).json({
        message:
          "Order data appears to be tampered. Please contact security/admin.",
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({ message: "Order status updated", order });
  } catch (err) {
    console.error("❌ updateOrderStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// =============================
// 🛡️ ADMIN: MARK ORDER AS PAID
// =============================
export const markOrderPaid = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId)
      .populate("user", "name email")
      .populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.isPaid) {
      return res
        .status(400)
        .json({ message: "Order is already marked as paid." });
    }

    // ✅ Integrity check before confirming payment
    const integrityResult = await verifyOrderIntegrityOrWarn(order);
    if (!integrityResult.ok) {
      return res.status(409).json({
        message:
          "Order data appears to be tampered. Payment not processed. Please investigate.",
      });
    }

    order.isPaid = true;
    order.paymentMethod = order.paymentMethod || "COD";
    order.paidAt = Date.now();
    await order.save();

    // 👉 FAST RESPONSE TO ADMIN
    res.status(200).json({
      message: "✅ Order marked as paid. Invoice will be emailed shortly.",
      order,
    });

    // 📧 BACKGROUND: generate invoice + email
    (async () => {
      try {
        const invoicePath = path.resolve(`invoices/invoice-${order._id}.pdf`);
        if (!fs.existsSync("invoices")) {
          fs.mkdirSync("invoices", { recursive: true });
        }

        await generateInvoice(order, invoicePath);

        await sendOrderEmail(
          order.user.email,
          "🧾 Updated Invoice - Payment Confirmed",
          `Dear ${order.user.name},\n\nYour payment has been confirmed. Please find the updated invoice attached.\n\nThank you,\nKheldokan`,
          invoicePath
        );

        fs.unlink(invoicePath, () => {});
        console.log("📧 Payment invoice sent:", order._id.toString());
      } catch (err) {
        console.error("❌ markOrderPaid invoice/email error:", err);
      }
    })();
  } catch (err) {
    console.error("❌ markOrderPaid error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
