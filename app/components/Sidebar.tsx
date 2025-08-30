"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

import {
  Home,
  UserRound,
  FileText,
  
  Calendar,
  MessageSquareWarning,
  LogOut,
} from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  const [user, setUser] = useState<User | null>(null);
  const [isadmin, setisadmin] = useState(false);
  const [superadmin,setsuperadmin]=useState(false);
  const [username,setusername]=useState("")
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().role === "admin") {
        setisadmin(true);
      }
      if (docSnap.exists() && docSnap.data().role==="superadmin"){
        setsuperadmin(true)
      } 
      if(docSnap.exists()){
        setusername(docSnap.data().name)
      }
    });

    return () => unsubscribe();
  }, [isadmin, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

 const navItems = [
  { href: "/dashboard", icon: Home, label: "DashBoard" },
  { href: "/dashboard/candidates", icon: UserRound, label: "Candidates" },
  { href: "/dashboard/jd", icon: FileText, label: "Job Openings" },
  { href: "/dashboard/calender", icon: Calendar, label: "Calender" },
  ...(superadmin
    ? [{ href: "/dashboard/aireport", icon: MessageSquareWarning, label: "AI-Report" }]
    : []),
];

  return (
    <div className="w-20 md:w-64 h-screen bg-gradient-to-br from-[#ff9f43] to-[#ff6b00] shadow-xl flex flex-col border-r border-gray-200 transition-all duration-300">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
        <h1 className="text-4xl underline font-extrabold ml-6 mb-10 text-white hidden md:block">
          Synthora
        </h1>

        <nav className="space-y-8 mt-7">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} className="block">
                <div
                  className={`flex items-center justify-center md:justify-start md:space-x-3 w-full px-3 py-2 rounded-lg transition ${
                    isActive
                      ? "bg-white text-orange-600 font-bold"
                      : "text-white hover:bg-orange-200"
                  }`}
                >
                  <Icon size={20} />
                  <span className="hidden md:inline text-lg font-bold ">
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-200">
          {user && (
            <div className="mb-3 hidden md:block">
              <p className="text-sm text-white">Logged in as</p>
              <p className="font-bold font-inter text-white break-all">
                {username}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center text-white md:justify-start md:space-x-2 text-sm font-medium hover:text-red-800 transition"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
