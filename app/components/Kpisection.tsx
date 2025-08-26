/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import Loading from "../components/Loading";
import { KpiCard } from "./Kpicard";
import { FiUsers, FiFileText, FiClipboard } from "react-icons/fi";
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

export const KpiSection = () => {
  const [recruitersCount, setRecruitersCount] = useState<number | null>(null);
  const [adminsCount, setAdminsCount] = useState<number | null>(null);
  const [resumesCount, setResumesCount] = useState<number | null>(null);
  const [jobsCount, setJobsCount] = useState<number | null>(null);

  const [userdata, setUserdata] = useState<UserType>();
  const [loading, setLoading] = useState(true);
  const router=useRouter()
  // get logged in user data
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
  }, []);

  // fetch counts
  useEffect(() => {
    async function fetchCounts() {
      if (!userdata) return;
      setLoading(true);

      try {
        // recruiter counts depend on role
        if (userdata.role === "admin") {
          // recruiters in same company
          const q = query(
            collection(db, "users"),
            where("companyId", "==", userdata.companyId),
            where("role", "==", "recruiter")
          );
          const snap = await getCountFromServer(q);
          setRecruitersCount(snap.data().count);
        } else if (userdata.role === "superadmin") {
          // all recruiters + admins
          const qRecruiters = query(
            collection(db, "users"),
            where("adminid", "==", userdata.id)
          );
          const qAdmins = query(
            collection(db, "users"),
            where("role", "==", "admin")
          );

          const [recSnap, adminSnap] = await Promise.all([
            getCountFromServer(qRecruiters),
            getCountFromServer(qAdmins),
          ]);

          setRecruitersCount(recSnap.data().count);
          setAdminsCount(adminSnap.data().count);
        }

        // everyone sees resumes & jobs
        const resumesSnap = await getCountFromServer(collection(db, "resumes"));
        const q = query(
      collection(db, "job_descriptions"),
      where("companyId", "==", userdata.companyId)
    );
        const jobsSnap = await getCountFromServer(q);

        setResumesCount(resumesSnap.data().count);
        setJobsCount(jobsSnap.data().count);
      } catch (error) {
        console.error("Error fetching KPI counts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCounts();
  }, [userdata]);

  if (loading) return <Loading />;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-3">
      {userdata?.role === "admin" && (
        <KpiCard
          title="My Recruiters"
          value={recruitersCount ?? 0}
          icon={<FiUsers />}
        />
      )}

      {userdata?.role === "superadmin" && (
        <>
          <KpiCard
            title="All Recruiters"
            value={recruitersCount ?? 0}
            icon={<FiUsers />}
          />
          <KpiCard
            title="All Admins"
            value={adminsCount ?? 0}
            icon={<FiUsers />}
          />
           <KpiCard
        title="Resumes Uploaded"
        value={resumesCount ?? 0}
        icon={<FiFileText />}
      />
        </>
      )}

      {/* always visible */}
     
      <KpiCard
        title="Job Descriptions"
        value={jobsCount ?? 0}
        icon={<FiClipboard />}
      />
    </section>
  );
};
