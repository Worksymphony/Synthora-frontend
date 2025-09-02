"use client";
import Sidebar from "../components/Sidebar";
import React, { useState, createContext } from "react";
import { Toaster } from "react-hot-toast";
import { LoadingProvider } from "../../app/context/LoadingContext";
// Create context


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  

  return (
    <LoadingProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 ">
          {children}
          <Toaster position="bottom-right" reverseOrder={false} />
        </main>
      </div>
    </LoadingProvider>
  );
}
