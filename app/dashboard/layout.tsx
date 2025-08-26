// app/dashboard/layout.tsx

import Sidebar from '../components/Sidebar';
import React from 'react';
import { Toaster } from "react-hot-toast";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 ">
        {children}
         <Toaster position="top-right" reverseOrder={false} />
      </main>
    </div>
  );
}
