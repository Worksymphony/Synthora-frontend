"use client";
import { createContext, useState, Dispatch, SetStateAction, ReactNode } from "react";

type LoadingContextType = {
  loading1: boolean;
  setLoading1: Dispatch<SetStateAction<boolean>>;
};

export const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading1, setLoading1] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading1, setLoading1 }}>
      {children}
    </LoadingContext.Provider>
  );
}
