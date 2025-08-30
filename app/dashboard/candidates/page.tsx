/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import axios from "axios";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  Search,
  User,
  Eye,
  NotebookPen,
  UserRoundPen,
} from "lucide-react";
import { serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import UploadModal from "@/app/components/UploadModal";
import CandidateModal from "@/app/components/CandidateModal";
import toast from "react-hot-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import Notes from "@/app/components/Notes";
import { FixedSizeList as List, ListOnItemsRenderedProps } from "react-window";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";

const auth = getAuth();

type FirestoreTimestamp = {
  _seconds: number;
  _nanoseconds: number;
};

interface MetadataItem {
  id: string;
  fileName?: string;
  fileURL?: string;
  email?: string;
  role?: string;
  phone?: number;
  uploadedAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
  skills: string | string[] | null;
  location?: string;
  sector?: string;
  companyId?: string;
  recruiterId?: string;
  name?: string;
  companyname?: string;
  hiringstatus?: string;
  notes?: string;
}
type ResumeAssignment = {
  id: string;
  recruiterId: string;
  companyId: string;
  resumeId: string;
  companyname: string;
};

export default function Page() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user] = useAuthState(auth);

  // INPUT STATES
  const [searchitem, setsearchitem] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);

  // APPLIED FILTERS
  const [applied, setApplied] = useState({
    search: "",
    skill: "",
    location: "",
    sector: "",
    sortBy: "",
  });

  const [loading, setLoading] = useState(true);
  const [loading1, setLoading1] = useState(false);
  const [listHeight, setListHeight] = useState(500);
  const [selectedId, setselectedId] = useState("");
  const [Username, setUsername] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedId1, setSelectedId1] = useState<string | null>(null);
  const [notediag, setnotediag] = useState(false);

  const [companyname, setCompanyname] = useState("");
  const [companyId, setcompanyId] = useState("");

  const [metadata, setmetadata] = useState<MetadataItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  const fetchingRef = useRef(false);
  const ITEM_HEIGHT = 250;

  useEffect(() => {
    setListHeight(Math.min(window.innerHeight * 0.72, 1000));
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const fetchUsername = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUsername(docSnap.data().name);
          setCompanyname(docSnap.data().companyname);
          setcompanyId(docSnap.data().companyId);
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    };
    fetchUsername();
  }, [user]);

  const updateHiringStatus = async (candidateId: string, newStatus: string) => {
    setmetadata((prev) =>
      prev.map((item) =>
        item.id === candidateId ? { ...item, hiringstatus: newStatus } : item
      )
    );

    try {
      const res = await fetch(
        `https://synthora-backend.onrender.com/api/upload/hiringstatus/${candidateId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hiringstatus: newStatus }),
        }
      );
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      toast.success("Successfully updated Status");
    } catch (err) {
      console.error("Error updating hiring status:", err);
      toast.error("Error updating hiring status");

      setmetadata((prev) =>
        prev.map((item) =>
          item.id === candidateId ? { ...item, hiringstatus: item.hiringstatus } : item
        )
      );
    }
  };


  const refreshFromStart = async () => {
    setLoading(true);
    setmetadata([]);
    setNextPageToken(null);
    await fetchMetadata(null, true);
  };

  const fetchRecruiter = async (companyId: string): Promise<ResumeAssignment[]> => {
    try {
      const q = query(
        collection(db, "resumeAssignments"),
        where("companyId", "==", companyId)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ResumeAssignment, "id">),
      }));
    } catch (error) {
      console.error("Error fetching recruiter assignments:", error);
      return [];
    }
  };


  const fetchMetadata = useCallback(
    async (token: string | null = null, clear = false) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      // Use `setLoading` only for initial load or new searches
      if (clear) {
        setLoading(true);
      } else if (token) {
        // Use `setLoadingMore` for subsequent pages
        setLoadingMore(true);
      }

      try {
        const url = new URL("https://synthora-backend.onrender.com/api/getmetadata");
        url.searchParams.set("pageSize", "10");
        if (token) url.searchParams.set("pageToken", token);

        if (applied.search) url.searchParams.set("search", applied.search);
        if (applied.skill) url.searchParams.set("skill", applied.skill);
        if (applied.location) url.searchParams.set("location", applied.location);
        if (applied.sector) url.searchParams.set("sector", applied.sector);
        if (applied.sortBy) url.searchParams.set("sortBy", applied.sortBy);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
        const data = await res.json();

        const recruiterAssignments = await fetchRecruiter(companyId);
        const mergedData = (data.metadata ?? []).map((resume: any) => {
          const assignment = recruiterAssignments.find((a) => a.resumeId === resume.id);
          return {
            ...resume,
            recruiterId: assignment?.recruiterId || null,
            companyId: assignment?.companyId || null,
            companyname: assignment?.companyname || null,
          };
        });

        if (clear) {
          setmetadata(mergedData);
        } else {
          setmetadata((prev) => [...prev, ...mergedData]);
        }
        setNextPageToken(data.nextPageToken ?? null);
      } catch (error) {
        console.error("Error fetching metadata with recruiter:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false); // Reset loadingMore state in all cases
        fetchingRef.current = false;
      }
    },
    [applied, companyId]
  );

  useEffect(() => {
    if (!companyId) return;
    fetchMetadata(null, true);
  }, [applied, fetchMetadata, companyId]);

  const handleSearch = () => {
    setApplied({
      search: searchitem.trim(),
      skill: selectedSkill.trim(),
      location: selectedLocation.trim(),
      sector: selectedSector.trim(),
      sortBy: sortBy || "",
    });
    setmetadata([]);
    setNextPageToken(null);
  };

  const handleClear = () => {
    setsearchitem("");
    setSelectedSkill("");
    setSelectedLocation("");
    setSelectedSector("");
    setSortBy("");
    setApplied({ search: "", skill: "", location: "", sector: "", sortBy: "" });
    setmetadata([]);
    setNextPageToken(null);
  };

  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const key = metadata[index];
    if (!key) {
      return <div style={style} className="p-4" >NO candidate</div>;
    }

    return (

      <div

        style={{
          ...style,
          top: (style.top as number) + 1,
          height: (style.height as number) - 12,
          padding: "2 8px",
        }}
        className="bg-white rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200 mx-2"
      >
        {!metadata && <>NO candidate</>}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-200 to-orange-400 flex items-center justify-center">
              <User className="text-white" size={22} />
            </div>
            <div>
              <p className="font-bold  text-gray-900 text-lg">
                {key?.name
                  ? key.name
                    .toString()
                    .toLowerCase()
                    .replace(/\b\w/g, (char) => char.toUpperCase())
                  : ""}
              </p>
              <p className="text-sm font-inter text-gray-900">{key.email}</p>
              <p className="text-sm font-inter text-gray-500">📞 {key.phone}</p>

              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-inter font-medium">
                  {key.role}
                </span>
              </div>

              {key.fileURL ? (
                <Link
                  href={key.fileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                    <Eye size={16} /> View File
                  </button>
                </Link>
              ) : (
                <span className="text-red-500 text-sm">No file</span>
              )}
              {!key.recruiterId ? (
                <input
                  placeholder="Set Recruiter Name"
                  className="border rounded-lg p-1 text-sm border-amber-800"
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      const recruiterId = (e.target as HTMLInputElement).value;

                      if (!recruiterId.trim()) return;

                      await addDoc(collection(db, "resumeAssignments"), {
                        resumeId: key.id,
                        recruiterId,
                        companyname: companyname,
                        companyId: companyId,

                        taggedAt: serverTimestamp(),
                        locked: true,
                      });
                      toast.success("Tagged Assign Successfully !");
                      setmetadata((prev: any) =>
                        prev.map((item: any) =>
                          item.id === key.id ? { ...item, recruiterId } : item
                        )
                      );
                    }
                  }}
                />
              ) : (
                <p className="text-sm font-inter text-gray-500">
                  Belongs To : {key.recruiterId}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <select
              value={key.hiringstatus ?? ""}
              onChange={(e) => updateHiringStatus(key.id, e.target.value)}
              className="border border-gray-300 rounded-lg px-3  py-2 text-sm"
            >
              <option value="">Hiring Process Pipeline</option>
              <option value="applied">🔥 Applied</option>
              <option value="screening">⚡ Screening</option>
              <option value="interview">⬇️ Interview</option>
              <option value="offer">📜 Offer</option>
              <option value="hired">✅ Hired</option>
              <option value="rejected">❌ Rejected</option>
            </select>

            <p className="text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded-lg">
              {key.notes || "No notes yet"}
            </p>

            <div className="text-xs text-gray-500 space-y-1">
              <div>
                <span className="font-medium">Uploaded:</span>{" "}
                {key.uploadedAt?._seconds
                  ? new Date(key.uploadedAt._seconds * 1000).toLocaleString()
                  : "No timestamp"}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{" "}
                {key.updatedAt?._seconds
                  ? new Date(key.updatedAt._seconds * 1000).toLocaleString()
                  : "No timestamp"}
              </div>
              <span className="text-gray-600  font-bold mt-6">
                {key?.companyname}
              </span>
            </div>

            <div key={key.id} className="flex items-center gap-2">
              <button
                onClick={() => {
                  setnotediag(true);
                  setselectedId(key.id);
                }}
                className="text-orange-400"
              >
                <NotebookPen />
              </button>

              <button
                onClick={() => {
                  setOpen(true);
                  setSelectedId1(key.id);
                }}
                className="text-orange-400"
              >
                <UserRoundPen />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const onItemsRendered = (props: ListOnItemsRenderedProps) => {
    const { visibleStopIndex } = props;
    const total = metadata.length;

    if (
      visibleStopIndex >= total - 5 &&
      nextPageToken &&
      !fetchingRef.current
    ) {
      fetchMetadata(nextPageToken);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      return <p>You must log in first.</p>;
    }
    if (!selectedFiles) {
      toast.error("Please upload at least one file.");
      return;
    }
    const uploadToastId = toast.loading("Uploading resumes...");
    try {
      setLoading1(true);
      setIsModalOpen(false);
      const formData = new FormData();
      Array.from(selectedFiles).forEach((file) =>
        formData.append("files", file)
      );
      formData.append("recuiter", Username);
      formData.append("companyname", companyname);
      formData.append("companyId", companyId);
      const res = await fetch("https://synthora-backend.onrender.com/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setmetadata([]);
        setNextPageToken(null);
        toast.success("Resumes uploaded successfully!", { id: uploadToastId });
        fetchMetadata(null, true);
      } else {
        const errData = await res.json();
        toast.error(`Upload failed: ${errData.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Upload exception:", err);
      toast.error("Something went wrong.", { id: uploadToastId });
    } finally {
      setLoading1(false);
    }
  };

  return (
    <div className="w-full px-4 md:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 ">
            Candidate Database
          </h1>
          <p className="text-sm text-orange-500 font-inter">
            Manage your talent pipeline with AI-powered insights
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={loading1}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium shadow"
        >
          <Plus size={16} className="inline-block mr-1 " />
          {loading1 ? "Uploading..." : "Add Candidates"}
        </button>
      </div>

      {/* Filters */}
      <div
        className=" animate-glow flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-[0_8px_10px_-3px_rgba(0,0,0,0.25),0_0px_6px_rgba(0,0,0,0.1)]
 border"
      >
        <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg">
          <Search className="text-gray-500 mr-2" size={16} />
          <input
            type="text"
            value={searchitem}
            onChange={(e) => setsearchitem(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search candidates by name"
            className="bg-transparent outline-none font-inter font-bold text-sm w-40 md:w-auto"
          />
        </div>

        <input
          type="text"
          value={selectedSkill}
          onChange={(e) => setSelectedSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Filter by Skill"
          className="bg-gray-100 font-inter font-bold text-sm px-4 py-2 rounded-lg text-gray-700"
        />
        <input
          type="text"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Filter by Location"
          className="bg-gray-100 font-bold font-inter text-sm px-4 py-2 rounded-lg text-gray-700"
        />
        <input
          type="text"
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="Filter by Sector"
          className="bg-gray-100 font-bold font-inter text-sm px-4 py-2 rounded-lg text-gray-700"
        />

        <button
          onClick={() => setSortBy(sortBy === "recent" ? "" : "recent")}

          className={`text-sm font-bold font-inter px-4 py-2 rounded-lg border ${sortBy === "recent"
              ? "bg-blue-100 text-blue-700 border-blue-400"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-transparent"
            }`}
        >
          Sort by Most Recent
        </button>

        <button
          onClick={handleSearch}
          className="text-sm px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
        >
          Search / Apply
        </button>

        <button
          onClick={handleClear}
          className="text-sm px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
        >
          Clear Filters
        </button>
      </div>

      {/* Virtualized List */}
      <div style={{ height: "72vh", width: "100%" }} className="bg-transparent">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 font-semibold">
            Loading candidate...
          </div>
        ) : metadata.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 font-semibold">
            🚫 No candidates found
          </div>
        ) : (
          <>
            <List
              height={listHeight}
              itemCount={metadata.length}
              itemSize={ITEM_HEIGHT}
              width={"100%"}
              onItemsRendered={onItemsRendered}
            >
              {Row}
            </List>

            <div className="flex justify-center py-4 font-inter font-medium">
              {loadingMore
                ? "Loading more candidates..."
                : nextPageToken
                  ? "Scroll for more..."
                  : "No more candidates"}
            </div>
          </>
        )}
      </div>

      {/* Notes modal */}
      {notediag && (
        <Notes
          isopen={notediag}
          ID={selectedId}
          metadata={refreshFromStart}
          setMetadata={setmetadata}
          onclick={() => setnotediag(false)}
        />
      )}

      {/* Upload modal */}
      {isModalOpen && (
        <UploadModal
          handleSubmit={handleSubmit}
          handleFileChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSelectedFiles(e.target.files)
          }
          handleModalToggle={() => setIsModalOpen(false)}
          loading={loading}
          selectedFiles={selectedFiles}
        />
      )}
      {open && (
        <CandidateModal
          open={open}
          onClose={() => setOpen(false)}
          candidateId={selectedId1}
        />
      )}
    </div>
  );
}