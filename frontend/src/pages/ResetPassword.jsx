import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiHome } from "react-icons/fi";
import Header from "../layouts/Header";
import { resetPassword } from "../services/authService";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match", {
        style: {
          background: "#f87171",
          color: "white",
          border: "1px solid #ef4444",
        },
        iconTheme: {
          primary: "#ef4444",
          secondary: "white",
        },
      });
      return;
    }

    try {
      setLoading(true);
      await resetPassword(token, password);
      toast.success("Password has been reset successfully");
      navigate("/login");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to reset password", {
        style: {
          background: "#f87171",
          color: "white",
          border: "1px solid #ef4444",
        },
        iconTheme: {
          primary: "#ef4444",
          secondary: "white",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      {/* Breadcrumb */}
      <div className="bg-[#f5f1eb] py-4 px-6 text-sm text-gray-700">
        <div className="max-w-5xl mx-auto flex items-center gap-2">
          <FiHome className="inline-block w-4 h-4" />
          <Link to="/" className="underline hover:text-gray-800">
            Home
          </Link>
          <span>/</span>
          <span className="text-black">Reset Password</span>
        </div>
      </div>

      {/* Reset Password Box */}
      <div className="flex justify-center px-4 mt-10">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-fade-in">
          <h2 className="text-center text-2xl font-semibold mb-6">
            Reset Your Password
          </h2>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-blue-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className={`w-full px-4 py-2 rounded-lg focus:outline-none ${
                  confirmPassword && confirmPassword !== password
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 bg-blue-50"
                }`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg text-white font-medium ${
                loading
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-[#e75b70] hover:bg-red-700"
              }`}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
