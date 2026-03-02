"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type User as FirebaseUser } from "firebase/auth";
import { auth, onAuthStateChanged, logout as firebaseLogout } from "@/lib/firebase";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get<User>("/api/auth/me");
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await fetchProfile();
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [fetchProfile]);

  const logout = useCallback(async () => {
    await firebaseLogout();
    setFirebaseUser(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ firebaseUser, user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
