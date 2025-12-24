// src/layout/Header.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  FaHeart,
  FaShoppingCart,
  FaSearch,
  FaBars,
  FaChevronDown,
} from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { MdOutlineLightbulb } from "react-icons/md";
import { useNavigate, NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getAllCategories } from "../services/categoryService";
import { getWishlistItems } from "../services/wishlistService";
import { getCart } from "../services/cartService";
import LogoutButton from "../pages/LogoutButton";
import logo from "../assets/kheldokan-logo.png";
import useSearchProducts from "../hooks/useSearchProducts";
import NotificationBell from "../components/common/NotificationBell";

const Header = () => {
  const { user, isAuthenticated, loading, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // separate refs
  const profileDropdownRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  const { results: suggestions, loading: loadingSuggestions } =
    useSearchProducts(search);

  const activeCategory = location.pathname.startsWith("/category/")
    ? decodeURIComponent(location.pathname.replace("/category/", "")).toLowerCase()
    : "";

  // 🔥 FUNCTIONS moved OUTSIDE useEffect so we can reuse them
  const fetchWishlistCount = async () => {
    try {
      if (isAuthenticated) {
        const items = await getWishlistItems();
        setWishlistCount(items?.length || 0);
      } else {
        const raw = localStorage.getItem("kalamkart_wishlist");
        const guest = raw ? JSON.parse(raw) : [];
        setWishlistCount(Array.isArray(guest) ? guest.length : 0);
      }
    } catch (err) {
      console.error("Wishlist count error:", err);
      setWishlistCount(0);
    }
  };

  const fetchCartCount = async () => {
    try {
      if (isAuthenticated) {
        const cart = await getCart();
        setCartCount(cart?.items?.length || 0);
      } else {
        setCartCount(0);
      }
    } catch (err) {
      console.error("Cart count error:", err);
      setCartCount(0);
    }
  };

  // 🧿 Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getAllCategories();
        setCategories(res);
      } catch (err) {
        console.error("Category error:", err);
      }
    };
    fetchCategories();
  }, []);

  // ❤️ Wishlist + Cart Count (initial + when auth changes)
  useEffect(() => {
    if (loading) return;
    fetchWishlistCount();
    fetchCartCount();
  }, [isAuthenticated, loading]);

  // 🔄 Listen to custom events from ProductDetailPage to live-update counters
  useEffect(() => {
    if (loading) return;

    const handleWishlistUpdate = () => {
      fetchWishlistCount();
    };

    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener("update-wishlist-count", handleWishlistUpdate);
    window.addEventListener("update-cart-count", handleCartUpdate);

    return () => {
      window.removeEventListener("update-wishlist-count", handleWishlistUpdate);
      window.removeEventListener("update-cart-count", handleCartUpdate);
    };
  }, [loading, isAuthenticated]);

  // 🪞 Profile reload listener
  useEffect(() => {
    const handler = async () => {
      try {
        const { getUserProfile } = await import("../services/userService");
        const full = await getUserProfile();
        setUser(full);
      } catch {
        window.location.reload();
      }
    };
    window.addEventListener("update-profile", handler);
    return () => window.removeEventListener("update-profile", handler);
  }, [setUser]);

  // 🧹 Click-outside handler
  useEffect(() => {
    const handleClick = (e) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target)
      ) {
        setShowProfileDropdown(false);
      }
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target)
      ) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 🔎 search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setShowSuggestions(false);
    }
  };

  return (
    <header className="w-full font-inter text-gray-800 shadow-sm relative z-30">
      {/* TOP STRIP */}
      <div className="flex justify-between items-center text-xs px-4 lg:px-12 py-1.5 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2 text-gray-500">
          <span>📍</span>
          <span>123 Main Street, Kathmandu, Nepal</span>
        </div>

        <div className="flex items-center gap-5 text-gray-500">
          <button className="hover:text-gray-900 flex items-center gap-1">
            NPR <span>▾</span>
          </button>
          <button className="hover:text-gray-900 flex items-center gap-1">
            EN <span>▾</span>
          </button>
          <button className="hover:text-red-500 font-medium">
            Track Your Order
          </button>
        </div>
      </div>

      {/* MAIN HEADER */}
      <div className="bg-white px-4 lg:px-12 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* SEARCH */}
        <div className="hidden lg:block flex-1 max-w-xl relative search-autocomplete">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Enter your search keywords ..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-full focus:outline-none"
            />
          </form>

          {showSuggestions && search && (
            <div className="absolute top-full mt-1 w-full max-h-[300px] overflow-y-auto bg-white shadow-xl rounded z-50 border border-gray-100">
              {loadingSuggestions ? (
                <div className="p-4 text-gray-500 text-sm">Loading...</div>
              ) : suggestions.length === 0 ? (
                <div className="p-4 text-gray-500 text-sm">No results found</div>
              ) : (
                suggestions.slice(0, 10).map((product) => (
                  <Link
                    key={product._id}
                    to={`/products?search=${encodeURIComponent(product.name)}`}
                    className="flex items-center gap-3 px-4 py-2 border-b hover:bg-gray-50"
                    onClick={() => {
                      setSearch("");
                      setShowSuggestions(false);
                    }}
                  >
                    <img src={product.image} className="w-10 h-10 border rounded" />
                    <div>
                      <span className="font-medium text-sm">{product.name}</span>
                      <span className="block text-xs text-gray-500">
                        NPR {product.price}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* LOGO */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 mx-auto lg:ml-20">
          <img src={logo} className="w-16 h-16 object-contain" />
          <span className="text-2xl font-extrabold tracking-wide">
            <span className="text-black">KHEL</span>
            <span className="text-red-600">DOK</span>
            <span className="text-black">AN</span>
          </span>
        </button>

        {/* PROFILE + NOTIFICATION + CART */}
        <div className="flex items-center gap-5">
          
          {/* PROFILE DROPDOWN */}
          {isAuthenticated ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setShowProfileDropdown((prev) => !prev)}
                className="flex items-center gap-2"
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    className="w-8 h-8 rounded-full border object-cover"
                  />
                ) : (
                  <FiUser className="text-xl" />
                )}
                <span className="hidden md:inline">
                  {user?.name?.split(" ")[0]}
                </span>
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white shadow-md rounded-lg border z-50">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100"
                  >
                    My Profile
                  </button>

                  <button
                    onClick={() => {
                      navigate("/orders");
                      setShowProfileDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-100"
                  >
                    View Orders
                  </button>

                  <div className="px-4 py-3 hover:bg-gray-100 cursor-pointer">
                    <LogoutButton />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-1 hover:text-red-500">
              <FiUser className="text-lg" /> SIGN IN
            </Link>
          )}

          {/* 🔔 NOTIFICATION */}
          <NotificationBell />

          {/* ❤️ Wishlist */}
          <Link to="/wishlist" className="relative">
            <FaHeart className="text-lg" />
            {wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] rounded-full px-1">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* 🛒 Cart */}
          <Link to="/cart" className="relative">
            <FaShoppingCart className="text-lg" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] rounded-full px-1">
                {cartCount}
              </span>
            )}
          </Link>

        </div>

      </div>

      {/* NAV BAR */}
      <div className="bg-[#0a1931] text-white sticky top-0 z-40 shadow-sm">
        <div className="px-4 lg:px-12 flex items-center justify-between">

          {/* BROWSE CATEGORIES */}
          <div className="relative" ref={categoryDropdownRef}>
            <button
              onClick={() => setShowCategoryDropdown((prev) => !prev)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-5 py-3 text-sm font-semibold uppercase"
            >
              <FaBars /> Browse Categories <FaChevronDown className="text-[11px]" />
            </button>

            {showCategoryDropdown && (
              <div className="absolute left-0 mt-1 w-72 bg-white text-gray-800 shadow-xl rounded border z-50">
                <div className="px-4 pt-3 pb-2 border-b">
                  <h3 className="text-sm font-semibold">Categories</h3>
                </div>

                <div className="px-4 py-2 space-y-2 max-h-80 overflow-y-auto">
                  {categories.map((cat) => {
                    const isActive = activeCategory === (cat.name || "").toLowerCase();

                    return (
                      <label
                        key={cat._id}
                        onMouseDown={() => {
                          navigate(`/category/${encodeURIComponent(cat.name)}`);
                          setShowCategoryDropdown(false);
                          window.scrollTo(0, 0);
                        }}
                        className={`flex items-center text-sm cursor-pointer px-2 py-2 rounded ${
                          isActive
                            ? "bg-red-600 text-white font-semibold"
                            : "hover:bg-gray-50 hover:text-red-600"
                        }`}
                      >
                        <input type="checkbox" checked={isActive} readOnly className="mr-2" />
                        <span>{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* NAV LINKS */}
          <ul className="hidden md:flex gap-8 text-sm font-medium">
            <li><NavLink to="/" className="hover:text-red-400">HOME</NavLink></li>
            <li><NavLink to="/products" className="hover:text-red-400">PRODUCTS</NavLink></li>
            <li><NavLink to="/about" className="hover:text-red-400">ABOUT</NavLink></li>
            <li><NavLink to="/contact" className="hover:text-red-400">CONTACT</NavLink></li>
          </ul>

          {/* RIGHT INFO */}
          <div className="hidden lg:flex items-center text-xs font-medium">
            <MdOutlineLightbulb className="mr-2 text-lg text-yellow-300" />
            <span className="mr-6">
              Clearance Up <span className="text-red-300">To 30% Off</span>
            </span>
            <span className="text-gray-200 border-l pl-4">
              Customer Care: +977 9845986352
            </span>
          </div>

        </div>
      </div>

    </header>
  );
};

export default Header;
