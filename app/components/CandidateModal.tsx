/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; 
import { db } from "@/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface CandidateModalProps {
  open: boolean;
  onClose: () => void;
  candidateId: string | null;
}

export default function CandidateModal({ open, onClose, candidateId }: CandidateModalProps) {
  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (candidateId) {
      const fetchCandidate = async () => {
        try {
          setLoading(true);
          const docRef = doc(db, "resumes", candidateId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setCandidate({
              id: docSnap.id,
              ...data,
              skills: Array.isArray(data.skills)
                ? data.skills
                : typeof data.skills === "string"
                ? data.skills.split(",").map((s) => s.trim())
                : [],
            });
          } else {
            console.log("No such candidate!");
          }
        } catch (error) {
          console.error("Error fetching candidate:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchCandidate();
    }
  }, [candidateId]);

  if (!candidateId) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCandidate((prev: any) => ({
      ...prev,
      [name]: name === "skills" ? value.split(",").map((s) => s.trim()) : value,
    }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateId || !candidate) return;

    try {
      const docRef = doc(db, "resumes", candidateId);
      await updateDoc(docRef, {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
      });
      console.log("Candidate updated successfully!");
      onClose(); // close modal after update
      toast.success("Candidate Details Updated Successfully !")
    } catch (error) {
      console.error("Error updating candidate:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Candidate</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p>Loading...</p>
        ) : candidate ? (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <input
              type="text"
              name="name"
              value={candidate.name || ""}
              onChange={handleChange}
              className="border rounded p-2"
            />
            <input
              type="email"
              name="email"
              value={candidate.email || ""}
              onChange={handleChange}
              className="border rounded p-2"
            />
            <input
              type="text"
              name="phone"
              value={candidate.phone}
              onChange={handleChange}
              className="border rounded p-2"
            />

            <button
              type="submit"
              className="bg-orange-500 text-white rounded p-2"
            >
              Update Candidate
            </button>
          </form>
        ) : (
          <p>No candidate found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
