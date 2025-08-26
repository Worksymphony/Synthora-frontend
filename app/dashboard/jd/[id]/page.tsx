/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { auth, db } from "../../../../firebase/config";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ThumbsDown, XCircle } from "lucide-react";
import toast from "react-hot-toast";

/** Types */
interface Job {
  JobTitle: string;
  ClientName: string;
  Location: string;
  SalaryRange: string;
  JobDescription: string;
  uid: string;
  matchedResumes?: string[];
  matchResult?: MatchResultResponse;
  neglectedResumes?: string[];
  additional?: string;
}

type MatchResult = {
  id: string;
  score: {
    parsed: {
      score: number;
      strengths: string[];
      weaknesses: string[];
      match_reasoning: string;
    };
    usage: number;
  };
};

type MatchResultResponse = MatchResult[];

interface Resume {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  role: string;
  sector: string;
  skills: string;
  fileName: string;
  fileURL: string;
  recruiterid: string;
  uploadedAt: any;
  embedding?: number[];
}

interface PageProps {
  // Next.js 15: in App Router, params is a Promise you must unwrap with React.use() in client components
  params: Promise<{ id: string }>;
}

/** Little helper */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function JobDetailPage({ params }: PageProps) {
  /** Next.js 15: unwrap params (Promise) */
  const { id: routeId } = use(params);

  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  const [userId, setUserId] = useState<string>("");
  const [matchResult, setMatchResult] = useState<MatchResultResponse>([]);
  const [jobId, setJobId] = useState<string>(""); // <- keep as string only
  const [companyId, setCompanyId] = useState<string>("");

  /** AI progress UI state */
  const aiSteps = useMemo(
    () => [
      "Reading JD",
      "Fetching candidate pool",
      "Scoring candidates",
      "Fetching resume details",
      "Saving results",
    ],
    []
  );
  const [aiVisible, setAiVisible] = useState(false);
  const [aiStepIndex, setAiStepIndex] = useState(0); // 0..steps-1
  const [aiProgress, setAiProgress] = useState(0); // 0..100
  const [aiBusy, setAiBusy] = useState(false);

  const progressPerStep = useMemo(
    () => Math.floor(100 / aiSteps.length),
    [aiSteps.length]
  );

  /** Auth bootstrap */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.uid);

      try {
        const docRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(docRef);
        const cid = snapshot.data()?.companyId ?? "";
        setCompanyId(cid);
      } catch (e) {
        console.error("Failed to read companyId", e);
      }
    });

    return () => unsubscribe();
  }, [router]);

  /** Fetch JD on mount + whenever the route id changes */
  useEffect(() => {
    const fetchJob = async () => {
      if (!routeId) return; // guard
      setLoading(true);
      try {
        setJobId(routeId);

        const jobRef = doc(db, "job_descriptions", routeId);
        const snapshot = await getDoc(jobRef);

        if (snapshot.exists()) {
          const jobData = snapshot.data() as Job;
          setJob(jobData);

          if (jobData.matchResult && jobData.matchedResumes?.length) {
            setMatchResult(jobData.matchResult);
            await getResumes(jobData.matchedResumes);
          } else {
            setMatchResult([]);
            setResumes([]);
          }
        } else {
          setJob(null);
        }
      } catch (e) {
        console.error("Error fetching job:", e);
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [routeId]);

  const saveAdditionalNote = async () => {
    if (!jobId) return;
    try {
      const jobRef = doc(db, "job_descriptions", jobId);
      await updateDoc(jobRef, {
        additional: note,
      });
      toast.success("Note saved successfully!");
      setNote("");
      setOpen(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    }
  };

  /** Firestore fetch resumes by IDs (batched) */
  const getResumes = async (ids: string[]) => {
    if (!ids?.length) return;
    // Firestore `in` queries max 10 IDs — batch if needed
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    const all: Resume[] = [];
    for (const batch of chunks) {
      const col = collection(db, "resumes");
      const qy = query(col, where("__name__", "in", batch));
      const snap = await getDocs(qy);
      const fetched = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Resume, "id">),
      }));
      all.push(...(fetched as Resume[]));
    }
    setResumes(all);
  };

  /** AI overlay control helpers */
  const openAiOverlay = () => {
    setAiVisible(true);
    setAiStepIndex(0);
    setAiProgress(0);
    setAiBusy(true);
  };
  const stepDone = () => {
    setAiStepIndex((i) => {
      const next = Math.min(i + 1, aiSteps.length - 1);
      setAiProgress(Math.min(100, (next + 1) * progressPerStep));
      return next;
    });
  };
  const finishAiOverlay = () => {
    setAiProgress(100);
    setTimeout(() => {
      setAiBusy(false);
      setAiVisible(false);
    }, 600);
  };
  const failAiOverlay = () => {
    setAiBusy(false);
    setTimeout(() => setAiVisible(false), 900);
  };

  /** Click handler (recent) */
  const handleClickRecent = async () => {
    if (!job || aiBusy || !jobId) return;

    try {
      openAiOverlay();
      await sleep(350);
      stepDone();

      const res = await fetch(
        "https://synthora-backend.onrender.com/api/matching/recent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: jobId, companyId, userid: userId }),
        }
      );

      if (!res.ok) throw new Error("Failed to fetch");
      const apiRes = await res.json();

      if (apiRes.status === "limit_exceeded") {
        toast.success(apiRes.message);
      }
      if (apiRes.warning) {
        toast.success(apiRes.warning);
      }

      stepDone();

      await sleep(300);
      if (!Array.isArray(apiRes.data)) {
        throw new Error("Unexpected API response shape");
      }

      setMatchResult(apiRes.data);
      stepDone();

      const ids = apiRes.data.map((item: MatchResult) => item.id);
      await getResumes(ids);
      stepDone();

      const jobRef = doc(db, "job_descriptions", jobId);
      await updateDoc(jobRef, {
        matchedResumes: ids,
        matchResult: apiRes.data,
      });

      finishAiOverlay();
    } catch (error) {
      console.error(error);
      failAiOverlay();
    }
  };

  /** Click handler (full) */
  const handleClick = async () => {
    if (!job || aiBusy || !jobId) return;

    try {
      openAiOverlay();
      await sleep(350);
      stepDone();

      const res = await fetch(
        "https://synthora-backend.onrender.com/api/matching",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: jobId, companyId, userid: userId }),
        }
      );

      if (!res.ok) throw new Error("Failed to fetch");
      const apiRes = await res.json();

      if (apiRes.status === "limit_exceeded") {
        toast.success(apiRes.message);
      }
      if (apiRes.warning) {
        toast.success(apiRes.warning);
      }

      stepDone();

      await sleep(300);
      if (!Array.isArray(apiRes.data)) {
        throw new Error("Unexpected API response shape");
      }

      setMatchResult(apiRes.data);
      stepDone();

      const ids = apiRes.data.map((item: MatchResult) => item.id);
      await getResumes(ids);
      stepDone();

      const jobRef = doc(db, "job_descriptions", jobId);
      await updateDoc(jobRef, {
        matchedResumes: ids,
        matchResult: apiRes.data,
      });

      finishAiOverlay();
    } catch (error) {
      console.error(error);
      failAiOverlay();
    }
  };

  const updateCandidateStatus = async (
    jobIdParam: string,
    resumeId: string,
    status: "rejected" | "not_interested"
  ) => {
    if (!jobIdParam) return;
    const jobRef = doc(db, "job_descriptions", jobIdParam);
    await updateDoc(jobRef, {
      neglectedResumes: arrayUnion(resumeId),
    });
    toast.success("Successfully marked candidate");
  };

  /** UI */
  if (loading) return <div className="p-6">Loading...</div>;
  if (!job) return <div className="p-6">Job not found</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 bg-white font-inter rounded-lg shadow-lg relative">
      <div className="mt-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Additional Note</DialogTitle>
            </DialogHeader>
            <textarea
              className="w-full p-2 border rounded-lg"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write your note here..."
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={saveAdditionalNote}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Header */}
      <div className="flex space-x-7 ">
        <h1 className="text-3xl font-bold text-gray-900">{job.JobTitle}</h1>
        <Button
          onClick={() => setOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 ml-auto text-white"
        >
          Add Note
        </Button>
      </div>

      <div className="space-y-2 text-gray-700">
        <p>
          <strong>Client:</strong> {job.ClientName}
        </p>
        <p>
          <strong>Location:</strong> 📍 {job.Location}
        </p>
        <p>
          <strong>Salary Range:</strong> 💰 {job.SalaryRange}
        </p>
      </div>

      <div className="prose max-w-none">
        <h2 className="text-xl font-semibold">Job Description</h2>
        <p>{job.JobDescription}</p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={"outline"}
          className={`bg-orange-500 text-white hover:bg-orange-600 ${
            aiBusy ? "opacity-70 cursor-not-allowed" : ""
          }`}
          onClick={handleClick}
          disabled={aiBusy}
          aria-busy={aiBusy}
          aria-live="polite"
        >
          {aiBusy ? "AI is matching…" : "Find AI-Matching"}
        </Button>
        <Button
          variant={"outline"}
          className={`bg-orange-500 text-white hover:bg-orange-600 ${
            aiBusy ? "opacity-70 cursor-not-allowed" : ""
          }`}
          onClick={handleClickRecent}
          disabled={aiBusy}
          aria-busy={aiBusy}
          aria-live="polite"
        >
          {aiBusy ? "AI is matching…" : "Match Recent"}
        </Button>
      </div>

      {/* Results table */}
      {matchResult.length > 0 && (
        <table className="min-w-full table-auto border border-gray-300 mt-4">
          <thead>
            <tr>
              <th className="border px-4 py-2 w-1/5">Name</th>
              <th className="border px-4 py-2 w-[10%]">Score (0–100)%</th>
              <th className="border px-4 py-2 w-[20%]">Strengths</th>
              <th className="border px-4 py-2 w-[20%]">Weaknesses</th>
              <th className="border px-4 py-2 w-[25%]">Reasoning</th>
              <th className="border px-4 py-2 w-[10%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {matchResult.map((item) => {
              const resume = resumes.find((r) => r.id === item.id);
              return (
                <tr key={item.id}>
                  <td className="border px-4 py-2 text-blue-700 w-1/5">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={resume?.fileURL}
                    >
                      {resume?.name?.toLocaleUpperCase() || "N/A"}
                    </a>
                  </td>
                  <td className="border font-extrabold px-4 py-2 w-[10%]">
                    {item.score?.parsed.score ?? "NA"}%
                  </td>
                  <td className="border px-4 py-2 w-[20%]">
                    {item.score.parsed.strengths?.length
                      ? item.score.parsed.strengths.join(", ")
                      : "NA"}
                  </td>
                  <td className="border px-4 py-2 w-[20%]">
                    {item.score.parsed.weaknesses?.length
                      ? item.score.parsed.weaknesses.join(", ")
                      : "NA"}
                  </td>
                  <td className="border px-4 py-2 w-[25%]">
                    {item.score.parsed.match_reasoning || "NA"}
                  </td>
                  <td className="border px-4 py-2 w-[10%]">
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-100"
                        onClick={() =>
                          updateCandidateStatus(jobId, item.id, "rejected")
                        }
                        title="Reject"
                      >
                        <XCircle className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-yellow-600 hover:bg-yellow-100"
                        onClick={() =>
                          updateCandidateStatus(jobId, item.id, "not_interested")
                        }
                        title="Not Interested"
                      >
                        <ThumbsDown className="h-6 w-6" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* AI Overlay */}
      {aiVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[680px] max-w-[92vw] rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full animate-ping bg-orange-400 opacity-40" />
                <div className="absolute inset-1 rounded-full bg-orange-500 animate-pulse" />
              </div>
              <div>
                <div className="text-lg font-semibold">AI is working…</div>
                <div className="text-sm text-gray-600">
                  Reading the JD, scanning resumes, and computing match scores.
                </div>
              </div>
            </div>

            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all duration-500"
                style={{ width: `${aiProgress}%` }}
              />
            </div>

            <ul className="mt-4 space-y-2">
              {aiSteps.map((label, idx) => {
                const isDone = idx < aiStepIndex;
                const isActive = idx === aiStepIndex;
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-3 text-sm ${
                      isDone
                        ? "text-green-600"
                        : isActive
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 flex items-center justify-center rounded-full border ${
                        isDone
                          ? "bg-green-500 border-green-500 text-white"
                          : isActive
                          ? "border-orange-500 text-orange-500"
                          : "border-gray-300 text-gray-400"
                      }`}
                    >
                      {isDone ? "✓" : isActive ? "•" : ""}
                    </span>
                    <span>{label}</span>
                    {isActive && <span className="ml-2 animate-pulse">…</span>}
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex justify-end">
              <Button
                variant="ghost"
                className="text-gray-600"
                onClick={() => {
                  if (!aiBusy) setAiVisible(false);
                }}
                disabled={aiBusy}
              >
                {aiBusy ? "Working…" : "Close"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
