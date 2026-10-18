"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  acceptInviteCodeAction,
  createInviteCodeAction,
  getActiveInviteCodeAction,
  getCoupleDataAction,
} from "@/app/actions/couple";
import { useAuth } from "@/components/auth/AuthProvider";
import { getIdToken } from "@/services/auth";
import type { Couple, InviteCode, PartnerProfile } from "@/types/couple";

interface CoupleContextValue {
  couple: Couple | null;
  partner: PartnerProfile | null;
  activeInvite: InviteCode | null;
  loading: boolean;
  createInvite: () => Promise<InviteCode>;
  acceptInvite: (code: string) => Promise<void>;
  refreshCouple: () => Promise<void>;
}

const CoupleContext = createContext<CoupleContextValue | null>(null);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { refreshProfile, user } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [activeInvite, setActiveInvite] = useState<InviteCode | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCoupleData = useCallback(async () => {
    if (!user) {
      setCouple(null);
      setPartner(null);
      setActiveInvite(null);
      return;
    }

    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) {
        return;
      }

      if (user.coupleId) {
        const { couple: loadedCouple, partner: loadedPartner } =
          await getCoupleDataAction(token);
        setCouple(loadedCouple);
        setPartner(loadedPartner);
        setActiveInvite(null);
      } else {
        const invite = await getActiveInviteCodeAction(token);
        setActiveInvite(invite);
        setCouple(null);
        setPartner(null);
      }
    } catch (error) {
      console.error("Failed to load couple data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadCoupleData();
  }, [loadCoupleData]);

  const handleCreateInvite = useCallback(async (): Promise<InviteCode> => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }
      const invite = await createInviteCodeAction(token);
      setActiveInvite(invite);
      return invite;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAcceptInvite = useCallback(
    async (code: string): Promise<void> => {
      setLoading(true);
      try {
        const token = await getIdToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }
        const { couple: newCouple, partner: newPartner } =
          await acceptInviteCodeAction(token, code);
        setCouple(newCouple);
        setPartner(newPartner);
        setActiveInvite(null);
        await refreshProfile();
      } finally {
        setLoading(false);
      }
    },
    [refreshProfile],
  );

  return (
    <CoupleContext.Provider
      value={{
        couple,
        partner,
        activeInvite,
        loading,
        createInvite: handleCreateInvite,
        acceptInvite: handleAcceptInvite,
        refreshCouple: loadCoupleData,
      }}
    >
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple(): CoupleContextValue {
  const context = useContext(CoupleContext);
  if (!context) {
    throw new Error("useCouple must be used within a CoupleProvider");
  }
  return context;
}
