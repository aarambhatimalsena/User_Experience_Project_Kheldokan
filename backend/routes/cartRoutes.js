import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getCart).post(protect, addToCart);
router.put("/item", protect, updateCartItem);
router.delete("/item/:itemId", protect, removeFromCart);
router.delete("/", protect, clearCart);

export default router;
