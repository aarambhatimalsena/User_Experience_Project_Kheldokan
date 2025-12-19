import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const isExpired = Date.now() >= decoded.exp * 1000;

        if (isExpired) {
          localStorage.removeItem("token");
          setUser(null);
        } else {
          decoded.isAdmin = decoded.role === "admin";

          // ✅ Fetch full profile (for profileImage)
          fetch("/api/users/profile", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => res.json())
            .then((profile) => {
              setUser({ ...profile, isAdmin: profile.role === "admin" });
            })
            .catch((err) => {
              console.error("❌ Failed to fetch profile on init", err);
              setUser(decoded); // fallback
            });
        }
      } catch (err) {
        console.error("Invalid token", err);
        localStorage.removeItem("token");
        setUser(null);
      }
    } else {
      setUser(null);
    }

    setTimeout(() => setLoading(false), 50);
  }, []);

  const login = (token) => {
    try {
      const decoded = jwtDecode(token);
      decoded.isAdmin = decoded.role === "admin";
      localStorage.setItem("token", token);

      // ✅ Fetch full user profile after login
      fetch("/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((profile) => {
          setUser({ ...profile, isAdmin: profile.role === "admin" });
          window.dispatchEvent(new Event("update-wishlist-count"));
          window.dispatchEvent(new Event("update-cart-count"));
          window.dispatchEvent(new Event("update-profile")); // ✅ for Header update
        })
        .catch((err) => {
          console.error("❌ Failed to fetch profile after login", err);
          setUser(decoded); // fallback
        });
    } catch (err) {
      console.error("Invalid token during login()", err);
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.dispatchEvent(new Event("update-wishlist-count"));
    window.dispatchEvent(new Event("update-cart-count"));
  };

  const updateUser = (newData) => {
    setUser((prev) => ({ ...prev, ...newData }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
        setUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
