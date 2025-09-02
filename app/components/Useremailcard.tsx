/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import toast from "react-hot-toast";
import { Trash } from "lucide-react";
import axios from "axios";

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

export const UserListCard = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRecruiterId, setOpenRecruiterId] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<UserType | null>(null);
  const router = useRouter();

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
        setCurrentUserData(userData);
        setAuthorized(true);
      }

      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch data based on role
  useEffect(() => {
    async function fetchData() {
      if (!currentUserData) return;
      setLoading(true);

      try {
        if (currentUserData.role === "admin") {
          // ✅ Admin -> fetch recruiters for their company
          const recruitersQuery = query(
            collection(db, "users"),
            where("role", "==", "recruiter"),
            where("companyId", "==", currentUserData.companyId)
          );
          const querySnapshot = await getDocs(recruitersQuery);

          const recruiters: UserType[] = [];
          for (const docSnap of querySnapshot.docs) {
            const recruiterData = docSnap.data();
            const recruiterId = docSnap.id;

            const resumeQuery = query(
              collection(db, "resumes"),
              where("recuiterid", "==", recruiterId)
            );
            const resumeSnapshot = await getDocs(resumeQuery);

            recruiters.push({
              id: recruiterId,
              ...recruiterData,
              resumeCount: resumeSnapshot.size,
            });
          }

          setUsers(recruiters);
        } else if (currentUserData.role === "superadmin") {
          // fetch all admins
          const adminsQuery = query(
            collection(db, "users"),
            where("role", "==", "admin")
          );
          const adminSnapshot = await getDocs(adminsQuery);

          const admins: UserType[] = [];

          for (const adminDoc of adminSnapshot.docs) {
            const adminData = {
              id: adminDoc.id,
              ...adminDoc.data(),
            } as UserType;

            // fetch recruiters for this admin
            const recruiterQuery = query(
              collection(db, "users"),
              where("role", "==", "recruiter"),
              where("companyId", "==", adminData.companyId)
            );
            const recruiterSnap = await getDocs(recruiterQuery);

            const recruiters: UserType[] = [];
            for (const recDoc of recruiterSnap.docs) {
              const recData = recDoc.data();
              const recId = recDoc.id;

              const resumeQuery = query(
                collection(db, "resumeAssignments"),
                where("recruiterId", "==", recId)
              );
              const resumeSnapshot = await getDocs(resumeQuery);

              recruiters.push({
                id: recId,
                ...recData,
                resumeCount: resumeSnapshot.size,
              });
            }

            admins.push({ ...adminData, recruiters });
          }

          // ✅ also fetch recruiters directly under the superadmin
          const superRecruitersQuery = query(
            collection(db, "users"),
            where("role", "==", "recruiter"),
            where("companyId", "==", currentUserData.companyId)
          );
          const superRecruitersSnap = await getDocs(superRecruitersQuery);

          const superRecruiters: UserType[] = [];
          for (const recDoc of superRecruitersSnap.docs) {
            const recData = recDoc.data();
            const recId = recDoc.id;

            const resumeQuery = query(
              collection(db, "resumeAssignments"),
              where("recruiterId", "==", recId)
            );
            const resumeSnapshot = await getDocs(resumeQuery);

            superRecruiters.push({
              id: recId,
              ...recData,
              resumeCount: resumeSnapshot.size,
            });
          }

          // ✅ add the logged-in superadmin as a "virtual admin node"
          admins.push({
            ...currentUserData,
            recruiters: superRecruiters,
          });

          setUsers(admins);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }

    if (authorized && currentUserData) {
      fetchData();
    }
  }, [authorized, currentUserData]);

  if (checkingAuth) {
    return <p>Loading...</p>;
  }

  const handledelete = async (
  id: string,
  role?: string,
  companyId?: string
) => {
  try {
    if (!authorized) return;

    // ✅ Helper: delete all assignments for a given recruiterId
    const deleteAssignments = async (recruiterId: string) => {
      const assignmentsQuery = query(
        collection(db, "resumeAssignments"),
        where("recruiterId", "==", recruiterId)
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);

      const assignmentDeletes: Promise<void>[] = [];
      assignmentsSnap.forEach((docSnap) => {
        assignmentDeletes.push(deleteDoc(doc(db, "resumeAssignments", docSnap.id)));
      });

      await Promise.all(assignmentDeletes);
    };

    if (role === "admin") {
      // ✅ First delete all recruiters belonging to this admin's company
      const recruitersQuery = query(
        collection(db, "users"),
        where("role", "==", "recruiter"),
        where("companyId", "==", companyId)
      );
      const recruitersSnap = await getDocs(recruitersQuery);

      const deletePromises: Promise<void>[] = [];

      for (const recDoc of recruitersSnap.docs) {
        // delete recruiter’s assignments
        await deleteAssignments(recDoc.id);

        // delete recruiter user doc + auth
        deletePromises.push(deleteDoc(doc(db, "users", recDoc.id)));
        await axios.post("https://synthora-backend-production.up.railway.app/api/deleteAuthUser", { id: recDoc.id });
      }

      await Promise.all(deletePromises);

      // ✅ Delete admin’s assignments
      await deleteAssignments(id);

      // ✅ Then delete the admin
      await deleteDoc(doc(db, "users", id));
      await axios.post("https://synthora-backend-production.up.railway.app/api/deleteAuthUser", { id });

      toast.success("Admin, their recruiters, and all assignments deleted!");
      setUsers((prev) => prev.filter((user) => user.id !== id));
    } else {
      // ✅ Normal recruiter delete
      await deleteAssignments(id);

      await deleteDoc(doc(db, "users", id));
      await axios.post("https://synthora-backend-production.up.railway.app/api/deleteAuthUser", { id });

      toast.success("Recruiter and assignments deleted!");

      setUsers((prev) =>
        currentUserData?.role === "admin"
          ? prev.filter((user) => user.id !== id)
          : prev.map((admin) => ({
              ...admin,
              recruiters: admin.recruiters?.filter((r) => r.id !== id) || [],
            }))
      );
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    toast.error("Error deleting user");
  }
};


  const toggleRecruiter = (id: string) => {
    setOpenRecruiterId(openRecruiterId === id ? null : id);
  };

  return (
    <Card className="max-w-full overflow-x-auto mb-3">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className=" font-bold text-2xl">
          {currentUserData?.role === "superadmin"
            ? "Admins & Recruiters"
            : "Recruiter List"}
        </CardTitle>
        {(currentUserData?.role === "admin" ||
          currentUserData?.role === "superadmin") && (
          <Button
            className="sticky top-2 right-2 z-10 bg-orange-500 hover:bg-orange-600"
            onClick={() => router.push("/recruitor")}
          >
            Add New Recruiter
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p>No data found.</p>
        ) : currentUserData?.role === "admin" ? (
          // ✅ Admin view
          <div className="flex space-x-6 overflow-x-auto pb-2 ">
            {users.map(({ id, name, email, role, resumeCount }) => (
              <div
                key={id}
                className="min-w-[260px] bg-gradient-to-br from-white to-orange-50
                           rounded-2xl shadow-md p-5 flex-shrink-0 border border-orange-100
                           hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <p className="font-bold text-xl text-gray-800 mb-2">
                  {name ?? "Unnamed Recruiter"}
                </p>
                <p className="text-sm text-gray-600">
                  📧 {email || "No email"}
                </p>
                <p className="text-xs mt-1">🏷️ {role}</p>
                <p className="mt-4 text-lg font-semibold text-orange-600">
                  📄 {resumeCount ?? 0} Resumes
                </p>
                <Trash
                  className="mt-2 cursor-pointer hover:text-red-500"
                  onClick={() => handledelete(id)}
                />
              </div>
            ))}
          </div>
        ) : (
          // ✅ Superadmin view (Tree with Dropdown per admin)
          <div className="space-y-6">
            {users.map((admin) => {
              const isOpen = openRecruiterId === admin.id;
              return (
                <div
                  key={admin.id}
                  className="p-4 border rounded-xl bg-orange-50"
                >
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleRecruiter(admin.id)}
                  >
                    <h2 className="font-bold text-lg text-orange-800 mb-2">
                      👑<span className="text-black">{admin.companyname} </span> {admin.name} ({admin.email}) 
                    </h2>
                    <div className="flex items-center space-x-2">
                      {/* 🚫 Hide delete if it's the logged-in superadmin */}
                      {!(
                        admin.role === "superadmin" &&
                        admin.id === currentUserData?.id
                      ) && (
                        <Trash
                          className="cursor-pointer hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handledelete(admin.id, "admin", admin.companyId);
                          }}
                        />
                      )}
                      <span className="text-sm text-gray-600">
                        {isOpen ? "▲ Hide Recruiters" : "▼ Show Recruiters"}
                      </span>
                    </div>
                  </div>

                  {/* Recruiters dropdown */}
                  {isOpen && (
                    <div className="ml-6 mt-3 space-y-2">
                      {admin.recruiters && admin.recruiters.length > 0 ? (
                        admin.recruiters.map((r) => (
                          <div
                            key={r.id}
                            className="p-3 bg-white rounded-lg shadow flex justify-between"
                          >
                            <div>
                              <p className="font-semibold">{r.name}</p>
                              <p className="text-sm text-gray-600">
                                {r.email}
                              </p>
                              <p className="text-sm">
                                📄 {r.resumeCount ?? 0} Resumes
                              </p>
                            </div>
                            <Trash
                              className="cursor-pointer hover:text-red-500"
                              onClick={() => handledelete(r.id, "recruiter")}
                            />
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">No recruiters</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
