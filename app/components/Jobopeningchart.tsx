/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/firebase/config";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
interface UserType {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  companyId?: string;
  parentAdminId?: string;
  resumeCount?: number;
  recruiters?: UserType[];
  [key: string]: any;
}
function parseSalaryRange(salaryRange: string): number | null {
  // Example format: "10 Lpa", "8-12 Lpa", "15 LPA"
  // Extract average numeric value (in Lakhs per annum)
  if (!salaryRange) return null;

  // Normalize
  const str = salaryRange.toLowerCase().replace(/\s/g, "");

  // Match patterns like "10lpa", "8-12lpa"
  const rangeMatch = str.match(/(\d+)(-(\d+))?lpa/);
  if (!rangeMatch) return null;

  const min = parseInt(rangeMatch[1], 10);
  const max = rangeMatch[3] ? parseInt(rangeMatch[3], 10) : min;
  return (min + max) / 2;
}

export function JobOpeningKPIs() {
  const [totalOpenings, setTotalOpenings] = useState(0);
  const [activeOpenings, setActiveOpenings] = useState(0);
  const [userdata, setUserdata] = useState<UserType>();
  const [filledOpenings, setFilledOpenings] = useState(0);
  const [avgSalary, setAvgSalary] = useState<number | null>(null);
  const [priorityCounts, setPriorityCounts] = useState<Record<string, number>>({
    High: 0,
    Medium: 0,
    Low: 0,
  });
  const router=useRouter()
  const [loading, setLoading] = useState(true);
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
        if (!user) {
          router.push("/login");
          return;
        }
  
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const userData = { id: docSnap.id, ...docSnap.data() } as UserType;
          setUserdata(userData);
        }
      });
  
      return () => unsubscribe();
    }, [router]);
  

  useEffect(() => {
    async function fetchJDData() {
      setLoading(true);
      try {
        
        const q = query(
      collection(db, "job_descriptions"),
      where("companyId", "==", userdata?.companyId)
    ); // Change "jds" if your collection name differs
      const snapshot = await getDocs(q);

        let openingsSum = 0;
        let activeCount = 0;
        let filledCount = 0;
        let salarySum = 0;
        let salaryCount = 0;
        const priorityCounter: Record<string, number> = {
          High: 0,
          Medium: 0,
          Low: 0,
        };

        snapshot.forEach((doc) => {
          const data = doc.data();

          // Opening positions count
          const openingPositions = Number(data.openingPositions ?? 0);
          openingsSum += openingPositions;

          // Status active vs filled
          const status = (data.status ?? "").toLowerCase();
          if (status === "active") activeCount += openingPositions;
          else filledCount += openingPositions;

          // Salary avg calc
          const salary = parseSalaryRange(data.SalaryRange ?? "");
          if (salary !== null) {
            salarySum += salary;
            salaryCount++;
          }

          // Priority count (case insensitive)
          const priority = (data.priority ?? "").toLowerCase();
          if (priority === "high") priorityCounter.High++;
          
        });

        setTotalOpenings(openingsSum);
        setActiveOpenings(activeCount);
        setFilledOpenings(filledCount);
        setAvgSalary(salaryCount > 0 ? salarySum / salaryCount : null);
        setPriorityCounts(priorityCounter);
      } catch (error) {
        console.error("Error fetching job descriptions:", error);
      } finally {
        setLoading(false);
      }
    }

    if(userdata?.companyId){
    fetchJDData();}
  }, [userdata]);

  if (loading) return <p>Loading Job Opening KPIs...</p>;

  return (
   <div className="grid grid-flow-col auto-cols-fr gap-6  overflow-x-auto mt-5">
  {/* Main Stats */}
  <Card className="text-center bg-gradient-to-br from-indigo-50 to-white shadow-lg hover:shadow-xl transition-all rounded-2xl border border-indigo-100">
    <CardHeader>
      <CardTitle className="text-indigo-700 font-semibold">Total Openings</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-4xl font-extrabold text-indigo-900">{totalOpenings}</p>
    </CardContent>
  </Card>

  <Card className="text-center bg-gradient-to-br from-green-50 to-white shadow-lg hover:shadow-xl transition-all rounded-2xl border border-green-100">
    <CardHeader>
      <CardTitle className="text-green-700 font-semibold">Active Openings</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-4xl font-extrabold text-green-800">{activeOpenings}</p>
    </CardContent>
  </Card>

  <Card className="text-center bg-gradient-to-br from-gray-50 to-white shadow-lg hover:shadow-xl transition-all rounded-2xl border border-gray-200">
    <CardHeader>
      <CardTitle className="text-gray-600 font-semibold">Filled Openings</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-4xl font-extrabold text-gray-500">{filledOpenings}</p>
    </CardContent>
  </Card>

  <Card className="text-center bg-gradient-to-br from-amber-50 to-white shadow-lg hover:shadow-xl transition-all rounded-2xl border border-amber-100">
    <CardHeader>
      <CardTitle className="text-amber-700 font-semibold">Average Salary (LPA)</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-4xl font-extrabold text-amber-800">
        {avgSalary ? avgSalary.toFixed(1) : "N/A"}
      </p>
    </CardContent>
  </Card>

  {/* Priority Cards */}
  {["High"].map((level) => (
    <Card
      key={level}
      className={`text-center shadow-lg hover:shadow-xl transition-all rounded-2xl border 
        ${level === "High"
          ? "bg-gradient-to-br from-red-50 to-white border-red-100"
          : level === "Medium"
          ? "bg-gradient-to-br from-yellow-50 to-white border-yellow-100"
          : "bg-gradient-to-br from-gray-50 to-white border-gray-200"}`}
    >
      <CardHeader>
        <CardTitle
          className={`font-semibold ${
            level === "High"
              ? "text-red-700"
              : level === "Medium"
              ? "text-yellow-700"
              : "text-gray-700"
          }`}
        >
          {level} Priority
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`text-4xl font-extrabold ${
            level === "High"
              ? "text-red-800"
              : level === "Medium"
              ? "text-yellow-800"
              : "text-gray-600"
          }`}
        >
          {priorityCounts[level] || 0}
        </p>
      </CardContent>
    </Card>
  ))}
</div>

  );
}
