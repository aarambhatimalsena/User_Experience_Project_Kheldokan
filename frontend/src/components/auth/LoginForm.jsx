import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import useLoginUser from "../../hooks/useLoginUser";
import { useAuth } from "../../auth/AuthProvider";
import toast from "react-hot-toast";
import InlineAlert from "../common/InlineAlert";
import { GoogleLogin } from "@react-oauth/google";

const LoginForm = () => {
  const { login } = useAuth();
  const { mutate: loginUser, isPending } = useLoginUser();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e75b70] bg-gray-50 transition-all";

  const handlePasswordLogin = (e) => {
    e.preventDefault();

    loginUser(
      { email, password },
      {
        onSuccess: (data) => {
          // 1) token AuthProvider lai de
          login(data.token);

          // 2) toast
          showToast("success", "Login successful!");

          // 3) admin / normal user route
          if (data.isAdmin) {
            navigate("/admin/dashboard");
          } else {
            navigate("/dashboard");
          }
        },
        onError: (error) => {
          const msg =
            error?.response?.data?.message ||
            error?.message ||
            "Login failed";

          if (msg.includes("User does not exist")) {
            showToast("error", "User does not exist. Please register first.");
          } else {
            showToast("error", "Invalid email or password.");
          }
        },
      }
    );
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const res = await fetch("/api/users/google-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token);
        toast.success("Google login successful!");

        const decoded = JSON.parse(atob(data.token.split(".")[1]));
        if (decoded.isAdmin) {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        toast.error(data.message || "Google login failed");
      }
    } catch (error) {
      toast.error("Google login error");
    }
  };

  return (
    <div className="relative max-w-md mx-auto space-y-6 animate-fade-in">
      <div className="rounded-2xl ring-1 ring-gray-200 shadow-xl p-6 bg-white transition-transform hover:scale-[1.01] relative">
        {/* ✅ Password Login Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          {/* Email field with label */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* Password field with label */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={inputClass}
              />
              <div
                className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 text-right">
            <Link to="/forgot-password" className="hover:underline">
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-[#e75b70] text-white py-3 rounded-md font-medium hover:bg-[#dc4c61] transition"
            disabled={isPending}
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* ✅ Google Login */}
        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => toast.error("Google login failed")}
          />
        </div>
      </div>

      <p className="text-center text-sm text-gray-500">
        Don’t have an account?{" "}
        <Link
          to="/register"
          className="text-[#e75b70] font-medium hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
