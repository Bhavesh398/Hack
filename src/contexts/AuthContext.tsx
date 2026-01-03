import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthority: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthority, setIsAuthority] = useState(() => {
    // Check localStorage for existing authority session
    return localStorage.getItem("isAuthority") === "true";
  });

  const login = () => {
    setIsAuthority(true);
    localStorage.setItem("isAuthority", "true");
  };

  const logout = () => {
    setIsAuthority(false);
    localStorage.removeItem("isAuthority");
  };

  return (
    <AuthContext.Provider value={{ isAuthority, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
