import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import {
  FaPhoneAlt,
  FaClock,
  FaEnvelope,
  FaShoppingCart,
  FaSearch,
  FaCheckCircle,
  FaCreditCard,
  FaRegFileAlt,
} from "react-icons/fa";

const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

/** Clean “F1 Journey” map in light theme */
const JourneyMap = ({ steps, activeIndex, onSelect }) => {
  const points = [
    { x: 10, y: 68 },
    { x: 25, y: 85 },
    { x: 45, y: 78 },
    { x: 62, y: 62 },
    { x: 74, y: 44 },
    { x: 70, y: 24 },
    { x: 54, y: 18 },
    { x: 34, y: 26 },
    { x: 18, y: 42 },
  ].slice(0, Math.min(steps.length, 9));

  return (
    <div className="border border-gray-200 rounded-[18px] bg-white p-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Order Journey Map
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Follow the checkpoints from product browsing to invoice email.
          </p>
        </div>
        <p className="text-[11px] text-gray-400">
          Click a checkpoint to jump to that step
        </p>
      </div>

      <div className="mt-4">
        <svg viewBox="0 0 100 100" className="w-full h-[210px] sm:h-[240px]">
          <path
            d="
              M10,68
              C18,92 42,96 54,78
              C66,60 90,58 82,36
              C74,16 52,10 34,26
              C16,42 4,54 10,68
            "
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="
              M10,68
              C18,92 42,96 54,78
              C66,60 90,58 82,36
              C74,16 52,10 34,26
              C16,42 4,54 10,68
            "
            fill="none"
            stroke="#d60028"
            opacity="0.6"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* start/finish line */}
          <rect
            x="7.8"
            y="62.5"
            width="5"
            height="12"
            rx="1"
            fill="#111827"
            opacity="0.15"
          />
          <rect x="8.3" y="63.2" width="4" height="2" fill="#ffffff" opacity="0.9" />
          <rect x="8.3" y="66.2" width="4" height="2" fill="#111827" opacity="0.25" />
          <rect x="8.3" y="69.2" width="4" height="2" fill="#ffffff" opacity="0.9" />
          <rect x="8.3" y="72.2" width="4" height="2" fill="#111827" opacity="0.25" />

          {points.map((p, idx) => {
            const active = idx === activeIndex;
            return (
              <g
                key={idx}
                onClick={() => onSelect(idx)}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={active ? 5.2 : 4.6}
                  fill={active ? "rgba(214,0,40,0.12)" : "rgba(17,24,39,0.06)"}
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={active ? 2.5 : 2.2}
                  fill={active ? "#d60028" : "rgba(17,24,39,0.45)"}
                />
                <text
                  x={p.x}
                  y={p.y - 7}
                  textAnchor="middle"
                  fontSize="4"
                  fill="rgba(17,24,39,0.75)"
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {steps.map((s, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(idx)}
              className={`text-left rounded-xl px-3 py-2 border text-xs transition
                ${
                  idx === activeIndex
                    ? "bg-[#fee2e2] border-[#fecaca]"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
            >
              <div className="font-semibold text-gray-900">
                {idx + 1}. {s.short}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">{s.mini}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Help = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [search, setSearch] = useState("");

  const steps = useMemo(
    () => [
      {
        short: "Products",
        mini: "Browse items",
        title: "1) Browse Products",
        desc:
          "Go to Products and browse categories like shoes, jerseys, balls, and training gear. Use search and filters to find what you need.",
        actionText: "Go to Products",
        actionLink: "/products",
      },
      {
        short: "Product Detail",
        mini: "View info",
        title: "2) Open Product Details",
        desc:
          "Click a product to see full details (images, price, brand, description).",
      },
      {
        short: "Options",
        mini: "Size/Qty",
        title: "3) Select Options (if available)",
        desc:
          "If your product has size or options, select them and choose quantity before adding to cart.",
      },
      {
        short: "Add to Cart",
        mini: "Save item",
        title: "4) Add to Cart",
        desc:
          "Click “Add to Cart”. Your item will be stored in the cart.",
      },
      {
        short: "Cart",
        mini: "Review total",
        title: "5) Review Your Cart",
        desc:
          "Open Cart, check items, update quantity if needed, and verify the total price.",
        actionText: "Open Cart",
        actionLink: "/cart",
      },
      {
        short: "Proceed",
        mini: "From Cart only",
        title: "6) Proceed to Checkout (From Cart)",
        desc:
          "In the Cart page, click “Proceed to Checkout”. You cannot directly checkout without cart items.",
      },
      {
        short: "Pay",
        mini: "Khalti/eSewa",
        title: "7) Pay with Khalti / eSewa",
        desc:
          "Choose your payment method (Khalti or eSewa), complete payment, then return to Kheldokan for order confirmation.",
      },
      {
        short: "Confirm",
        mini: "Order success",
        title: "8) Order Confirmation",
        desc:
          "After successful payment, you will see the confirmation screen and your order will be recorded in your account.",
      },
      {
        short: "Invoice",
        mini: "Email receipt",
        title: "9) Receive Invoice by Email",
        desc:
          "An invoice/receipt is sent to your registered email after the order is confirmed.",
      },
    ],
    []
  );

  const faqs = useMemo(
    () => [
      {
        q: "Which payment methods are available?",
        a: "Kheldokan supports Khalti and eSewa for online payments.",
      },
      {
        q: "Will I receive an invoice?",
        a: "Yes. After successful order confirmation, an invoice/receipt is sent to your registered email.",
      },
      {
        q: "Payment completed but order not confirmed. What should I do?",
        a: "Contact support with your transaction reference (Khalti/eSewa) and the email/phone you used for the order.",
      },
      {
        q: "Why can’t I directly open checkout?",
        a: "Checkout depends on cart items. First add products to cart, then proceed to checkout from the Cart page.",
      },
    ],
    []
  );

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
    );
  }, [search, faqs]);

  const jumpToStep = (idx) => {
    setActiveIndex(idx);
    setTimeout(() => {
      const el = document.getElementById("help-steps");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const active = steps[activeIndex];

  return (
    <>
      {/* BREADCRUMB STRIP */}
      <div className="bg-[#f5f1eb] py-4 px-6 text-sm text-gray-700 border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <FiHome className="inline-block w-4 h-4" />
          <Link to="/" onClick={scrollTop} className="hover:underline hover:text-gray-800">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <span className="font-semibold text-gray-900">Help</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-10">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Help Center
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Step-by-step guide from products to cart → checkout → Khalti/eSewa → invoice email.
            </p>
          </div>

          {/* ONLY Products + Cart links (NO checkout link) */}
          <div className="flex flex-wrap gap-2">
            <Link
              to="/products"
              onClick={scrollTop}
              className="px-4 py-2 border border-gray-300 rounded-full text-xs uppercase tracking-[0.18em] bg-white hover:bg-gray-100 text-gray-800"
            >
              Browse Products
            </Link>
            <Link
              to="/cart"
              onClick={scrollTop}
              className="px-4 py-2 border border-gray-300 rounded-full text-xs uppercase tracking-[0.18em] bg-white hover:bg-gray-100 text-gray-800 flex items-center gap-2"
            >
              <FaShoppingCart className="text-xs" /> Cart
            </Link>
          </div>
        </div>

        {/* Journey Map */}
        <JourneyMap steps={steps} activeIndex={activeIndex} onSelect={jumpToStep} />

        {/* CONTENT */}
        <div className="mt-8 flex flex-col lg:flex-row gap-8" id="help-steps">
          {/* LEFT */}
          <section className="flex-1 bg-white border border-gray-200 rounded-[18px] p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Step-by-Step Procedure
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Step {activeIndex + 1} of {steps.length}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-500">
                <FaCheckCircle className="text-[#d60028]" />
                Easy customer journey
              </div>
            </div>

            <div className="mt-5 border border-gray-200 rounded-2xl p-5 bg-white">
              <h3 className="text-base font-semibold text-gray-900">
                {active.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                {active.desc}
              </p>

              {active.actionLink && (
                <Link
                  to={active.actionLink}
                  onClick={scrollTop}
                  className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-[#d60028] hover:underline"
                >
                  <FaCheckCircle /> {active.actionText}
                </Link>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => jumpToStep(Math.max(0, activeIndex - 1))}
                  className="px-4 py-2 border border-gray-300 rounded-full text-xs uppercase tracking-[0.18em] bg-white hover:bg-gray-100 text-gray-800"
                >
                  ← Previous
                </button>
                <button
                  onClick={() =>
                    jumpToStep(Math.min(steps.length - 1, activeIndex + 1))
                  }
                  className="px-4 py-2 border border-gray-300 rounded-full text-xs uppercase tracking-[0.18em] bg-gray-900 hover:bg-black text-white"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Payment & Invoice */}
            <div className="mt-6 border border-gray-200 rounded-2xl p-5 bg-white">
              <div className="flex items-center gap-2">
                <FaCreditCard className="text-[#d60028]" />
                <h3 className="font-semibold text-gray-900">Payment & Invoice</h3>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Payment methods: <span className="font-semibold">Khalti</span> and{" "}
                <span className="font-semibold">eSewa</span>. After payment, your order
                is confirmed and an invoice is sent to your email.
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <FaRegFileAlt className="text-[#d60028]" />
                <span>
                  Invoice will be emailed to your <span className="font-semibold">registered email</span>.
                </span>
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <aside className="w-full lg:w-80 space-y-6">
            {/* FAQ */}
            <div className="bg-white border border-gray-200 rounded-[18px] p-5">
              <div className="flex items-end justify-between gap-2">
                <h3 className="font-semibold text-gray-900">FAQs</h3>
                <span className="text-[11px] text-gray-400">
                  {filteredFaqs.length} items
                </span>
              </div>

              <div className="mt-3 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search FAQs..."
                  className="w-full border border-gray-300 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-[#d60028]"
                />
              </div>

              <div className="mt-4 space-y-2">
                {filteredFaqs.map((item, idx) => (
                  <details
                    key={idx}
                    className="border border-gray-200 rounded-xl p-3 bg-white"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                      {item.q}
                    </summary>
                    <p className="mt-2 text-sm text-gray-600">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white border border-gray-200 rounded-[18px] p-5">
              <h3 className="font-semibold text-gray-900">Need Help?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Contact us if you face any issue in cart/checkout/payment.
              </p>

              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <FaPhoneAlt className="text-[#d60028]" />
                  <span className="font-semibold">(+977) 98459-86352</span>
                </div>

                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-gray-500" />
                  <span>support@kheldokan.com</span>
                </div>

                <div className="flex items-center gap-2">
                  <FaClock className="text-gray-500" />
                  <span>Sun – Fri: 9:00 – 20:00</span>
                </div>
              </div>
            </div>

            {/* Quick links (NO checkout link) */}
            <div className="bg-white border border-gray-200 rounded-[18px] p-5">
              <h3 className="font-semibold text-gray-900">Quick Links</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Link
                  to="/products"
                  onClick={scrollTop}
                  className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 text-gray-800 text-center"
                >
                  Products
                </Link>
                <Link
                  to="/cart"
                  onClick={scrollTop}
                  className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 text-gray-800 text-center"
                >
                  Cart
                </Link>

                <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 text-center">
                  Checkout
                  <p className="text-[10px] text-gray-500 mt-1">
                    From Cart only
                  </p>
                </div>

                <Link
                  to="/contact"
                  onClick={scrollTop}
                  className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 text-gray-800 text-center"
                >
                  Contact
                </Link>
              </div>
            </div>

            {/* Hint */}
            <div className="border border-gray-200 rounded-[18px] p-5 bg-[#fff7ed]">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Tip:</span> If payment succeeds but the order
                is not confirmed, share your <span className="font-semibold">transaction reference</span>{" "}
                (Khalti/eSewa) and your email/phone with support.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};
export default Help;
