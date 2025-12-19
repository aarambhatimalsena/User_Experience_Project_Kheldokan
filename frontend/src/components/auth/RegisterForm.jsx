import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { registerUserService } from "../../services/authService";
import InlineAlert from "../common/InlineAlert";

const RegisterForm = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const showToast = (type, message) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-sm mx-auto bg-white shadow-lg rounded-lg p-4`}
      >
        <InlineAlert type={type} message={message} />
      </div>
    ));
  };

  useEffect(() => {
    const checkEmail = async () => {
      if (!email) return;
      try {
        const res = await fetch("http://localhost:5000/api/users/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setEmailAvailable(data.available);
      } catch {
        setEmailAvailable(false);
      }
    };
    const timeout = setTimeout(checkEmail, 800);
    return () => clearTimeout(timeout);
  }, [email]);

  const passwordStrength = () => {
    if (password.length > 8 && /[A-Z]/.test(password) && /\d/.test(password)) return "Strong";
    if (password.length > 5) return "Medium";
    return "Weak";
  };

  const handlePasswordRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return showToast("error", "Passwords do not match");
    if (!agreed) return showToast("error", "You must agree to the terms");
    try {
      const data = await registerUserService({ name, email, password });
      localStorage.setItem("token", data.token);
      showToast("success", "Registered successfully!");
      navigate("/");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Register failed");
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#e75b70] bg-gray-50 transition-all";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl ring-1 ring-gray-200 shadow-xl p-6 bg-white transition-transform hover:scale-[1.01]">
        <form onSubmit={handlePasswordRegister} className="space-y-4" autoComplete="on">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
            autoComplete="name"
          />
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              autoComplete="email"
            />
            {email && (
              <span
                className={`absolute right-4 top-3 text-xs ${
                  emailAvailable ? "text-green-600" : "text-red-500"
                }`}
              >
                {emailAvailable ? "Available" : "Taken"}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
              autoComplete="new-password"
            />
            <div
              className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </div>
            {password && (
              <p className="text-xs mt-1 text-gray-500">
                Strength:{" "}
                <span
                  className={`font-medium ${
                    passwordStrength() === "Strong"
                      ? "text-green-600"
                      : passwordStrength() === "Medium"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  {passwordStrength()}
                </span>
              </p>
            )}
          </div>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={inputClass}
            autoComplete="new-password"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-600">I agree to the terms & conditions</label>
          </div>

          <button
            type="submit"
            className="w-full bg-[#e75b70] text-white font-semibold py-3 rounded-lg hover:bg-[#dc4c61] transition"
          >
            Sign up
          </button>
        </form>

        <div className="text-center text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#e75b70] font-medium hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
