/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HoverEffect } from "@/components/ui/card-hover-effect";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import UploadJdModal from "@/app/components/UploadJdmodal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/firebase/config";

type Job = {
  id: string;
  JobTitle: string;
  ClientName: string;
  Location: string;
  SalaryRange: string;
  JobDescription?: string;
  openingPositions: number;
  status?: "active" | "closed";
  priority?: "High" | "Medium" | "Low";
  createdAt?: Timestamp;
};
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

export default function Page() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [newjd, setNewjd] = useState<any>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
   const [userdata, setUserdata] = useState<UserType>()
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [tempOpeningPositions, setTempOpeningPositions] = useState(0);
  const [tempStatus, setTempStatus] = useState<"active" | "closed">("active");
  const [tempPriority, setTempPriority] = useState<"High" | "Medium" | "Low">("Medium");

  const handleModalToggle = () => setIsModalOpen(!isModalOpen);
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
        setNewjd((prev: any) => ({ ...prev, companyId: userData.companyId }));
      }
    });
    
    return () => unsubscribe();
  }, [router]);
  // Fetch jobs safely
  const getJobs = async () => {
    try {
      const res = await fetch("https://synthora-backend.onrender.com/api/getjobdesc",{
        method:"POST",
         headers: {
        "Content-Type": "application/json", // 👈 Add this line
      },
        body:JSON.stringify({companyId:userdata?.companyId})
      });
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
    }
  };

  useEffect(() => {
    if (userdata?.companyId) { // This check is the key!
    getJobs();
  }
  }, [userdata]);

  // Submit new job
  const handleSubmitJob = async () => {
    
    try {
      const uploadToastId = toast.loading("Uploading JD...");
      await fetch("https://synthora-backend.onrender.com/api/job_description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newjd),
      });
      
      toast.success("Job Created Successfully!",{id:uploadToastId});
      getJobs();
      setNewjd({});
    } catch (error) {
      console.log(error)
      toast.error("Failed to create job");
    }
  };

  // Start editing
  const startEditing = (job: Job) => {
    setEditingJobId(job.id);
    setTempOpeningPositions(job.openingPositions ?? 0);
    setTempStatus(job.status ?? "active");
    setTempPriority(job.priority ?? "Medium");
  };

  const cancelEditing = () => setEditingJobId(null);

  // Save edited job
  const handleSaveEdit = async (jobId: string) => {
    try {
      const res = await fetch(`https://synthora-backend.onrender.com/api/job_description/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openingPositions: tempOpeningPositions,
          status: tempStatus,
          priority: tempPriority,
        }),
      });
      if (!res.ok) throw new Error("Failed to update job");
      toast.success("Job Updated Successfully!");
      setEditingJobId(null);
      getJobs();
    } catch (error) {
      console.log(error)
      toast.error("Error updating job");
    }
  };

  // Delete job
  const handleDelete = async (jobId: string) => {
    try {
      const res = await fetch(`https://synthora-backend.onrender.com/api/job_description/${jobId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to delete job");
      toast.success("Job Deleted Successfully!");
      getJobs();
    } catch (error) {
      console.log(error)
      toast.error("Error deleting job");
    }
  };

  // Filter jobs safely
  const filteredJobs = (jobs || [])
    .filter((job) =>
      `${job.JobTitle} ${job.ClientName} ${job.Location}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    

  return (
    <div className="p-6 space-y-6">
      {/* Top Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold ">Job Openings</h1>
        <div className="space-x-2 ">
          {/* Manual Create Job */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-orange-500">Create Manually</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Job Opening</DialogTitle>
                <DialogDescription>Fill the details to add a new job listing.</DialogDescription>
              </DialogHeader>

              <form className="space-y-4">
                {["JobTitle", "ClientName", "Location", "SalaryRange"].map((field) => (
                  <Input
                    key={field}
                    name={field}
                    placeholder={field}
                    value={newjd[field] || ""}
                    onChange={(e) => setNewjd({ ...newjd, [e.target.name]: e.target.value })}
                  />
                ))}

                <Input
                  placeholder="Opening Position"
                  name="openingPositions"
                  min={1}
                  type="number"
                  value={newjd.openingPositions || ""}
                  onChange={(e) =>
                    setNewjd({ ...newjd, openingPositions: Number(e.target.value) })
                  }
                  className="border rounded p-2 w-full"
                  required
                />

                <select
                  name="priority"
                  value={newjd.priority || "Medium"}
                  onChange={(e) => setNewjd({ ...newjd, priority: e.target.value })}
                  className="border rounded p-2 w-full font-inter"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                <textarea
                  name="JobDescription"
                  placeholder="Job Description"
                  value={newjd.JobDescription || ""}
                  onChange={(e) => setNewjd({ ...newjd, JobDescription: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md resize-none"
                  rows={4}
                />
              </form>

              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button onClick={handleSubmitJob} type="button" className="w-full">
                    Save Job
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button onClick={handleModalToggle} variant="outline">
            Upload JD
          </Button>
        </div>
      </div>

      {isModalOpen && <UploadJdModal handleModalToggle={handleModalToggle} companyId={userdata?.companyId} getjobs={getJobs} />}

      {/* Search & Filter */}
      <div className="relative w-1/2 rounded-2xl overflow-hidden">
  <div className="relative z-10 w-full">
    <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-[#ff7b54] via-[#ffbe7b] to-[#ffde59] shadow-2xl">
      <Input
        placeholder="Search jobs, clients, or locations..."
        className="
          w-full h-11 py-4 pl-12 pr-6 text-lg rounded-2xl
          bg-white/90 backdrop-blur-lg
          border-none
          placeholder-gray-400
          focus:outline-none
        "
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {/* Search Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
        />
      </svg>
    </div>
  </div>
</div>


      {/* Jobs List */}
      <div className="max-w-12xl mx-auto px-2">
        { jobs.length===0 && <h1 className="text-3xl font-extrabold text-center mt-26">No Job Openings</h1>}
        <HoverEffect
          items={filteredJobs.map((job) => ({
            title: job.JobTitle,
            description: `${job.ClientName || ""} | ${job.Location || ""} | ${job.SalaryRange || ""}`,
            content: (
              <div className="space-y-3 bg-white p-4 rounded-xl shadow-lg text-black">
                <div className="flex justify-between items-start text-black">
                  <div>
                    <h2 className="font-bold  text-lg">{job.JobTitle}</h2>
                    <p className="text-lg font-medium font-inter">{job.ClientName}</p>
                  </div>

                  {editingJobId === job.id ? (
                    <div className="flex flex-col gap-3 items-end">
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="number"
                          min={0}
                          className="border p-1 rounded w-20"
                          value={tempOpeningPositions}
                          onChange={(e) => setTempOpeningPositions(Number(e.target.value))}
                          autoFocus
                        />
                        <select
                          value={tempStatus}
                          onChange={(e) =>
                            setTempStatus(e.target.value as "active" | "closed")
                          }
                          className="border p-1 rounded"
                        >
                          <option value="active">Active</option>
                          <option value="closed">Closed</option>
                        </select>
                        <select
                          value={tempPriority}
                          onChange={(e) =>
                            setTempPriority(e.target.value as "High" | "Medium" | "Low")
                          }
                          className="border p-1 rounded"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(job.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-red-500 px-3 py-1 rounded border border-red-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="cursor-pointer text-right" onClick={() => startEditing(job)}>
                      <p>
                        Openings: <span className="font-semibold">{job.openingPositions}</span>
                      </p>
                      <p>
                        Status:{" "}
                        <span
                          className={
                            job.status === "closed"
                              ? "text-red-600 font-semibold"
                              : "text-green-600 font-semibold"
                          }
                        >
                          {job.status ?? "active"}
                        </span>
                      </p>
                      <p>
                        Priority: <span className="font-semibold">{job.priority ?? "Medium"}</span>
                      </p>
                    </div>
                  )}
                </div>

                <p className="text-sm font-inter font-medium">📍 {job.Location}</p>
                <p className="text-sm font-inter font-medium">💰 {job.SalaryRange}</p>
                <p className="text-gray-600 text-sm">
  {job.JobDescription?.length
    ? job.JobDescription.length > 100
      ? `${job.JobDescription.slice(0, 100)}...`
      : job.JobDescription
    : "-"}
</p>

                <Button
                  onClick={() => handleDelete(job.id)}
                  size={"sm"}
                  variant={"destructive"}
                  className="mt-auto "
                >
                  Delete
                </Button>
                <Button
                  onClick={() => router.push(`/dashboard/jd/${job.id}`)}
                  className="mt-auto  ml-24"
                >
                  View Details
                </Button>
              </div>
            ),
          }))}
        />
      </div>
    </div>
  );
}
