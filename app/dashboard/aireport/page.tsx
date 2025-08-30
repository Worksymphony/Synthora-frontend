/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

/** Types */
interface UserData {
  uid: string;
  email: string;
  usage: number;
}

interface RecruiterData {
  id: string;
  name: any;
  email: any;
  usage: number;
}

interface AdminData {
  adminid: string;
  adminname: any;
  companyname: any;
  usage: number; // admin’s own usage
  recruiters: RecruiterData[];
  totalusage: number; // admin + all recruiters combined
}

export default function AiReportPage() {
  const [loading, setLoading] = useState(true);
  const [allUsersData, setAllUsersData] = useState<UserData[]>([]);
  const [totalUsage, setTotalUsage] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [others, setOthers] = useState<AdminData[]>([]);
  const router = useRouter();

  // IMPORTANT: Replace this with the actual UID of your superadmin account
  const SUPERADMIN_UID = "YOUR_SUPERADMIN_UID_HERE";

  // Define your pricing model here
  const COST_PER_1000_TOKENS = 0.0015;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      let total = 0;
      const usersList: UserData[] = [];
      if (!currentUser) {
        router.push("/login");
        return;
      }

      // Check if the current user is the superadmin
      const docRef = doc(db, "users", currentUser.uid);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        if (snapshot.data().role === "superadmin") {
          total = snapshot.data().usage;
          usersList.push({
            uid: snapshot.data().uid,
            email: snapshot.data().email || "N/A",
            usage: snapshot.data().usage,
          });
          setIsSuperAdmin(true);
        } else {
          setIsSuperAdmin(false);
        }
      }

      const usersCollectionRef = query(
        collection(db, "users"),
        where("adminid", "==", currentUser.uid)
      );
      try {
        const querySnapshot = await getDocs(usersCollectionRef);

        querySnapshot.docs.forEach((docSnap) => {
          const userData = docSnap.data();
          const userUsage = userData.usage || 0;
          usersList.push({
            uid: docSnap.id,
            email: userData.email || "N/A",
            usage: userUsage,
          });
          total += userUsage;
        });

        setAllUsersData(usersList);
        setTotalUsage(total);
      } catch (error) {
        console.error("Error fetching all user data:", error);
      } finally {
        setLoading(false);
      }

      try {
        const adminDataList: AdminData[] = [];
        const q = query(collection(db, "users"), where("role", "==", "admin"));
        const snapshot = await getDocs(q);

        for (const adminDoc of snapshot.docs) {
          const adminInfo = adminDoc.data();
          const adminUsage = adminInfo.usage || 0;

          // fetch recruiters for this admin
          const recruitersQuery = query(
            collection(db, "users"),
            where("adminid", "==", adminDoc.id)
          );
          const recruitersSnapshot = await getDocs(recruitersQuery);

          const recruiters: RecruiterData[] = [];
          let recruitersTotal = 0;

          recruitersSnapshot.docs.forEach((recDoc) => {
            const recData = recDoc.data();
            const recUsage = recData.usage || 0;
            recruitersTotal += recUsage;

            recruiters.push({
              id: recDoc.id,
              name: recData.name,
              email: recData.email,
              usage: recUsage,
            });
          });

          adminDataList.push({
            adminid: adminDoc.id,
            adminname: adminInfo.name,
            companyname: adminInfo.companyname,
            usage: adminUsage,
            recruiters,
            totalusage: adminUsage + recruitersTotal,
          });
        }

        setOthers(adminDataList);
      } catch (error) {
        console.error("Error fetching other company data:", error);
      }
    });

    return () => unsubscribe();
  }, [router, SUPERADMIN_UID]);

  // Handle loading and access denial states
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading AI usage report...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">You do not have permission to view this page.</p>
      </div>
    );
  }

  // Calculate total estimated cost
  const totalEstimatedCost = ((totalUsage / 1000000) * 0.42).toFixed(2);

  return (
    <ScrollArea className="h-full w-full">
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Admin AI Usage Report</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{allUsersData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Tokens Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-gray-800 font-mono">
                {(totalUsage ?? 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Estimated Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 font-mono">
                ${totalEstimatedCost}
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-bold mb-4">User Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border  border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">User Email</th>
                <th className="border px-4 py-2 text-left">Tokens Used</th>
                <th className="border px-4 py-2 text-left">Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {allUsersData.length > 0 ? (
                allUsersData.map((user,index) => (
                  <tr key={user.uid || index} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{user.email}</td>
                    <td className="border px-4 py-2 font-mono">
                      {(user.usage ?? 0).toLocaleString()}
                    </td>
                    <td className="border px-4 py-2 font-mono">
                      ${((user.usage / 1000000) * 0.42).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="border px-4 py-2 text-center text-gray-500"
                  >
                    No user data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold mb-4 mt-4">Other Company Data</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border  border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Admin Name</th>
                <th className="border px-4 py-2 text-left">Company Name</th>
                <th className="border px-4 py-2 text-left">Admin Usage</th>
                <th className="border px-4 py-2 text-left">Recruiters</th>
                <th className="border px-4 py-2 text-left">Total Tokens Used</th>
                <th className="border px-4 py-2 text-left">Estimated Cost</th>
              </tr>
            </thead>
            <tbody>
              {others.length > 0 ? (
                others.map((admin,index) => (
                  <tr key={`${admin.adminid || index}`} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{admin.adminname}</td>
                    <td className="border px-4 py-2">{admin.companyname}</td>
                    <td className="border px-4 py-2">{admin.usage}</td>
                    <td className="border px-4 py-2">
                      {admin.recruiters.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {admin.recruiters.map((rec,recIndex) => (
                            <li key={`${rec.id || recIndex}-${admin.adminid}`}>
                              {rec.name} ({rec.email}) – {rec.usage}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">No recruiters</span>
                      )}
                    </td>
                    <td className="border px-4 py-2 font-mono">
                      {admin.totalusage.toLocaleString()}
                    </td>
                    <td className="border px-4 py-2 font-mono">
                      ${((admin.totalusage / 1000000) * 0.42).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="border px-4 py-2 text-center text-gray-500"
                  >
                    No company data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ScrollArea>
  );
}
