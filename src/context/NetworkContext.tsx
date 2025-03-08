// src/context/NetworkContext.tsx
import React, { createContext, useContext, useState } from "react";

interface NetworkContextType {
  network: "testnet" | "mainnet";
  setNetwork: (network: "testnet" | "mainnet") => void;
}

export const NetworkContext = createContext<NetworkContextType>({
  network: "testnet",
  setNetwork: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");

  return (
    <NetworkContext.Provider value={{ network, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
};
