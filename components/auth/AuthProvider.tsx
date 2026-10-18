"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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

  useEffect(() => {
    let currentSessionId = 0;

    const unsubscribe = subscribeAuthState(async (authUser) => {
      const sessionId = ++currentSessionId;

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const token = await getIdToken();
        if (sessionId !== currentSessionId) {
          return;
        }

        if (token) {
          const profile = await syncUserProfileAction(token);
          if (sessionId !== currentSessionId) {
            return;
          }
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        if (sessionId !== currentSessionId) {
          return;
        }
        console.error("Failed to sync user profile:", error);
        setUser(null);
      } finally {
        if (sessionId === currentSessionId) {
          setLoading(false);
        }
      }
    });

    return () => {
      currentSessionId += 1;
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
    setLoading(true);
    try {
      await authSignOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const token = await getIdToken();
      if (token) {
        const profile = await syncUserProfileAction(token);
        setUser(profile);
        return profile;
      }
    } catch (error) {
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
