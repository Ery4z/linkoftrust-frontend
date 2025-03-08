// src/context/CoinPriceContext.tsx
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface CoinPriceContextType {
  nearPrice: number | null;
}

const CoinPriceContext = createContext<CoinPriceContextType>({ nearPrice: null });

export const useCoinPrice = () => useContext(CoinPriceContext);

export const CoinPriceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nearPrice, setNearPrice] = useState<number | null>(null);

  const fetchCoinPrice = async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd"
      );
      const data = await res.json();
      if (data?.near?.usd) {
        setNearPrice(data.near.usd);
      }
    } catch (error) {
      console.error("Failed to fetch NEAR price", error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchCoinPrice();

    // Update price every minute (60000 ms)
    const interval = setInterval(fetchCoinPrice, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <CoinPriceContext.Provider value={{ nearPrice }}>
      {children}
    </CoinPriceContext.Provider>
  );
};
