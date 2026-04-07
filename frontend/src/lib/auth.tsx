import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import api from "@/lib/api";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: { id?: number; username?: string; name: string; email: string; role: "ADMIN" | "AGENT" | string } | null;
  login: (userDetails?: { id?: number; username?: string; name: string; email: string; role: "ADMIN" | "AGENT" | string }) => void;
  logout: () => void;
  reloadMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id?: number; username?: string; name: string; email: string; role: "ADMIN" | "AGENT" | string } | null>(null);

  const login = (userDetails?: { id?: number; username?: string; name: string; email: string; role: "ADMIN" | "AGENT" | string }) => {
    setUser(userDetails || { name: "User", email: "user@example.com", role: "AGENT" });
    setIsLoggedIn(true);
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout/", {});
    } catch {
      // ignore
    }
    setUser(null);
    setIsLoggedIn(false);
    setIsLoading(false);
  };

  const reloadMe = async () => {
    try {
      const res = await api.get("/api/users/me/");
      const u = res.data;
      setUser({
        id: u.id,
        username: u.username,
        name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username,
        email: u.email,
        role: u.role,
      });
      setIsLoggedIn(true);
    } catch {
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Load current user on refresh using cookie-based auth
  useEffect(() => {
    const isPublicFormsPage =
      window.location.pathname === "/forms" ||
      window.location.pathname.startsWith("/forms/") ||
      window.location.pathname === "/client/forms";

    if (isPublicFormsPage) {
      setIsLoading(false);
      return;
    }

    void reloadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, user, login, logout, reloadMe }}>
      {children}
    </AuthContext.Provider>
  );
}
