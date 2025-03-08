// src/context/UserDataContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { pollMyUser, UserDataView } from "@/lib/contractData";
import { useWallet } from "@/context/WalletContext";
import { useNetwork } from "@/context/NetworkContext";

interface UserDataContextType {
  myUserData: UserDataView | null;
  refreshUserData: () => Promise<void>;
}

export const UserDataContext = createContext<UserDataContextType>({
  myUserData: null,
  refreshUserData: async () => {},
});

export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { wallet, accountId,network } = useWallet();
  const [myUserData, setMyUserData] = useState<UserDataView | null>(null);

  // Dynamically set the contract ID based on network:
  const CONTRACT_ID = network === "testnet" ? "linkoftrust.testnet" : "linkoftrust.near";

  const refreshUserData = useCallback(async () => {
    if (wallet) {
      const data = await pollMyUser(accountId, CONTRACT_ID,network);
      setMyUserData(data);
    } else {
      setMyUserData(null);
    }
  }, [wallet, CONTRACT_ID]);

  // Refresh on wallet or network changes
  useEffect(() => {
    refreshUserData();
  }, [wallet, network, refreshUserData]);

  return (
    <UserDataContext.Provider value={{ myUserData, refreshUserData }}>
      {children}
    </UserDataContext.Provider>
  );
};
