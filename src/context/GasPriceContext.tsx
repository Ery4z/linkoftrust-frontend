// src/context/GasPriceContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface GasPriceContextType {
  gasPrice: number | null;
}

export const GasPriceContext = createContext<GasPriceContextType>({ gasPrice: null });

export const useGasPrice = () => useContext(GasPriceContext);

export const GasPriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gasPrice, setGasPrice] = useState<number | null>(null);

  const fetchGasPrice = async () => {
    try {
      const response = await fetch("https://rpc.testnet.near.org", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "gas_price",
          params: [null],
        }),
      });
      const data = await response.json();
      // Assuming the RPC returns something like: { result: { gas_price: "100000000000" } }
      if (data?.result?.gas_price) {
        // Convert gas_price to a number.
        setGasPrice(parseFloat(data.result.gas_price));
      }
    } catch (error) {
      console.error("Error fetching gas price:", error);
    }
  };

  useEffect(() => {
    // Fetch gas price immediately and then every minute (60000ms)
    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GasPriceContext.Provider value={{ gasPrice }}>
      {children}
    </GasPriceContext.Provider>
  );
};
