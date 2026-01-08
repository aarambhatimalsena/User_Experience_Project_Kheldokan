// src/services/cartService.js
import api from "../api/api";

// ➕ Add product to cart (backend expects { productId, quantity })
export const addToCart = async (productId, quantity = 1) => {
  const res = await api.post("/cart", { productId, quantity });
  return res.data;
};

// 📦 Get logged-in user's cart
export const getCart = async () => {
  const res = await api.get("/cart");
  return res.data;
};

// 🔁 Update cart item quantity
// NOTE: backend expects { productId, quantity } on /cart/item
export const updateCartQuantity = async (productId, quantity) => {
  const res = await api.put("/cart/item", { productId, quantity });
  return res.data;
};

// ❌ Remove item from cart (by item._id, not productId)
export const removeFromCart = async (itemId) => {
  const res = await api.delete(`/cart/item/${itemId}`);
  return res.data;
};

// 🧹 Clear entire cart
export const clearCart = async () => {
  const res = await api.delete("/cart");
  return res.data;
};
