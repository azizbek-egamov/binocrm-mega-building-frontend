import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshToken = async () => {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh) return false;

    try {
      const response = await api.post("/token/refresh/", { refresh });
      localStorage.setItem("accessToken", response.data.access);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  };

  const checkAuth = async () => {
    const accessToken = localStorage.getItem("accessToken");
    const savedUser = localStorage.getItem("user");

    if (accessToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        const response = await api.get("/user/");
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      } catch {
        const refreshed = await refreshToken();
        if (!refreshed) {
          logout();
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post("/token/", { username, password });
      const { access, refresh, user: userData } = response.data;

      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
      return { success: true };
    } catch (error) {
      let errorMessage = "Tizimga kirishda xatolik yuz berdi";

      if (error.response?.status === 401) {
        errorMessage = "Foydalanuvchi nomi yoki parol noto'g'ri";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.detail || "Ma'lumotlar noto'g'ri kiritilgan";
      } else if (error.response?.status === 500) {
        errorMessage = "Server xatosi. Iltimos, keyinroq urinib ko'ring";
      } else if (!error.response) {
        errorMessage = "Tarmoq xatosi. Internet aloqasini tekshiring";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      return { success: false, error: errorMessage };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshToken,
        refreshUser: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
