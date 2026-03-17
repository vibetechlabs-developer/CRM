import { useState, createContext, useContext, ReactNode } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  user: { name: string; email: string; role: string } | null;
  login: (token: string, userDetails?: { name: string; email: string; role: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("access_token"));
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  const login = (token: string, userDetails?: { name: string; email: string; role: string }) => {
    // You can decode the JWT token here to get user info if userDetails aren't provided
    setUser(userDetails || { name: "User", email: "user@example.com", role: "User" });
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
