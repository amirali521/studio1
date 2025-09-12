
"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface ShopDetails {
    name: string;
    address: string;
    phone: string;
}

interface ShopSettingsContextType {
  shopDetails: ShopDetails;
  setShopDetails: (value: ShopDetails | ((val: ShopDetails) => ShopDetails)) => void;
}

const ShopSettingsContext = createContext<ShopSettingsContextType | undefined>(undefined);

export function ShopSettingsProvider({ children }: { children: ReactNode }) {
  const [shopDetails, setShopDetails] = useLocalStorage<ShopDetails>('shop-details', {
      name: '',
      address: '',
      phone: ''
  });

  return (
    <ShopSettingsContext.Provider value={{ shopDetails, setShopDetails }}>
      {children}
    </ShopSettingsContext.Provider>
  );
}

export function useShopSettings() {
  const context = useContext(ShopSettingsContext);
  if (context === undefined) {
    throw new Error('useShopSettings must be used within a ShopSettingsProvider');
  }
  return context;
}
