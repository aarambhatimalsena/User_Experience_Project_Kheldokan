import axios from "../api/api";

export const loginUserService = async ({ email, password }) => {
  const response = await axios.post("/users/login", { email, password });
  return response.data;
};

export const registerUserService = async ({ name, email, password }) => {
  const response = await axios.post("/users/register", {
    name,
    email,
    password,
  });
  return response.data;
};

export const googleLogin = async (token) => {
  const response = await axios.post("/users/google-auth", { token });
  return response.data;
};

export const sendOtp = async (email) => {
  const response = await axios.post("/otp/send-otp", { email });
  return response.data;
};

export const verifyOtp = async (payload) => {
  const response = await axios.post("/otp/verify-otp", payload);
  return response.data;
};



// ✅ ADD THESE TWO 👇

// Send forgot password email
export const forgotPassword = async (email) => {
  const response = await axios.post("/users/forgot-password", { email });
  return response.data;
};

// Reset password with token
export const resetPassword = async (token, password) => {
  const response = await axios.post(`/users/reset-password/${token}`, { password });
  return response.data;
};
