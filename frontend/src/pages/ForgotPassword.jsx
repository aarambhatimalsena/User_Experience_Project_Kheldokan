import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import Header from "../layouts/Header";
import { forgotPassword } from "../services/authService";
import InlineAlert from "../components/common/InlineAlert";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const showToast = (type, message) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } absolute top-4 right-4 z-50 max-w-sm w-full bg-white border-l-4 ${
          type === "error" ? "border-red-500" : "border-green-500"
        } shadow-lg rounded-lg`}
      >
        <InlineAlert type={type} message={message} />
      </div>
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      showToast("success", "Reset link sent to your email.");
      setEmail("");
    } catch (err) {
      showToast("error", err?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <Header />

      {/* Breadcrumb */}
      <div className="bg-[#f5f1eb] py-4 px-6 text-sm text-gray-700">
        <div className="max-w-5xl mx-auto flex justify-start items-center gap-2">
          <FiHome className="inline-block w-4 h-4" />
          <Link to="/" className="underline hover:text-gray-800">
            Home
          </Link>
          <span>/</span>
          <span className="text-black font-regular">Forgot Password</span>
        </div>
      </div>

      {/* Form Box */}
      <div className="flex justify-center px-4 mt-10">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
          <h2 className="text-center text-2xl font-semibold mb-6">
            Reset Your Password
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e75b70] bg-gray-50"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e75b70] text-white py-3 rounded-md font-medium hover:bg-[#dc4c61] transition"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
