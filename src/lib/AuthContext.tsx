import { createContext, useContext } from "react";

interface AuthContextType {
  user: { uid: string } | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: { uid: "local" }, loading: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: { uid: "local" }, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
