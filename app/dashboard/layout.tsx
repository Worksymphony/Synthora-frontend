"use client";
import Sidebar from "../components/Sidebar";
import React, { useState, createContext } from "react";
import { Toaster } from "react-hot-toast";

// Create context
export const LoadingContext = createContext<{
  loading1: boolean;
  setLoading1: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading1, setLoading1] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading1, setLoading1 }}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 ">
          {children}
          <Toaster position="bottom-right" reverseOrder={false} />
        </main>
      </div>
    </LoadingContext.Provider>
  );
}
