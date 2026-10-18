"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { syncUserProfileAction } from "@/app/actions/user";
import {
  getIdToken,
  signIn as authSignIn,
  signOut as authSignOut,
  subscribeAuthState,
} from "@/services/auth";
import {
  AuthProvider as AuthProviderEnum,
  type UserProfile,
} from "@/types/user";

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  signIn: (provider: AuthProviderEnum) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionIdRef = useRef(0);

  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (authUser) => {
      sessionIdRef.current += 1;
      const sessionId = sessionIdRef.current;

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const token = await getIdToken();
        if (sessionId !== sessionIdRef.current) {
          return;
        }

        if (token) {
          const profile = await syncUserProfileAction(token);
          if (sessionId !== sessionIdRef.current) {
            return;
          }
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (sessionId !== sessionIdRef.current) {
          return;
        }
        console.error("Failed to sync user profile:", error);
        setUser(null);
      } finally {
        if (sessionId === sessionIdRef.current) {
          setLoading(false);
        }
      }
    });

    return () => {
      sessionIdRef.current += 1;
      unsubscribe();
    };
  }, []);

  const handleSignIn = useCallback(async (provider: AuthProviderEnum) => {
    setLoading(true);
    try {
      await authSignIn(provider);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    sessionIdRef.current += 1;
    setLoading(true);
    try {
      await authSignOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    const sessionId = sessionIdRef.current;
    try {
      const token = await getIdToken();
      if (sessionId !== sessionIdRef.current) {
        return null;
      }

      if (token) {
        const profile = await syncUserProfileAction(token);
        if (sessionId !== sessionIdRef.current) {
          return null;
        }
        setUser(profile);
        return profile;
      }
    } catch (error) {
      if (sessionId !== sessionIdRef.current) {
        return null;
      }
      console.error("Failed to refresh user profile:", error);
    }
    return null;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signOut: handleSignOut,
        refreshProfile: handleRefreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
