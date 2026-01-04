import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthority: boolean;
  departmentId: string | null;
  departmentName: string | null;
  login: (departmentId: string, departmentName: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthority, setIsAuthority] = useState(() => {
    // Check localStorage for existing authority session
    return localStorage.getItem("isAuthority") === "true";
  });

  const [departmentId, setDepartmentId] = useState<string | null>(() => {
    return localStorage.getItem("authorityDepartmentId");
  });

  const [departmentName, setDepartmentName] = useState<string | null>(() => {
    return localStorage.getItem("authorityDepartmentName");
  });

  const login = (deptId: string, deptName: string) => {
    setIsAuthority(true);
    setDepartmentId(deptId);
    setDepartmentName(deptName);
    localStorage.setItem("isAuthority", "true");
    localStorage.setItem("authorityDepartmentId", deptId);
    localStorage.setItem("authorityDepartmentName", deptName);
  };

  const logout = () => {
    setIsAuthority(false);
    setDepartmentId(null);
    setDepartmentName(null);
    localStorage.removeItem("isAuthority");
    localStorage.removeItem("authorityDepartmentId");
    localStorage.removeItem("authorityDepartmentName");
  };

  return (
    <AuthContext.Provider value={{ isAuthority, departmentId, departmentName, login, logout }}>
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
