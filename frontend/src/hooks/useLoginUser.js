import { useMutation } from "@tanstack/react-query";
import { loginUserService } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const useLoginUser = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ email, password }) => {
      const res = await loginUserService({ email, password });
      return res; // res = res.data from service
    },

    onSuccess: (data) => {
      const token = data?.token;

      if (!token) {
        console.error("❌ No token received from backend");
        return;
      }

      // save token + set user in context
      login(token);

      // decode to check admin or not
      const decoded = JSON.parse(atob(token.split(".")[1]));

      if (decoded.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    },

    onError: (err) => {
      console.error("❌ Login error:", err);
      throw err;
    },
  });
};

export default useLoginUser;
