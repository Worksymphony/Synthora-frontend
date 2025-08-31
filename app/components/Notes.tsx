/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/firebase/config';
import { collection, doc, query, updateDoc, where, getDocs } from 'firebase/firestore';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

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

type noteprops = {
  isopen: boolean;
  onclick: () => void;
  metadata: () => void;
  ID: string | null; // resumeId
  companyId: string; // 👈 Pass companyId from parent
  setMetadata: React.Dispatch<React.SetStateAction<MetadataItem[]>>;
};

const Notes: React.FC<noteprops> = ({ isopen, onclick, ID, companyId, setMetadata }) => {
  const [notes, setnotes] = useState("");

  if (!isopen) return null;

  const handleNotes = async (resumeId: string | null) => {
    if (!resumeId) return;
    try {
      // Find the assignment for this company + resume
      const q = query(
        collection(db, "resumeAssignments"),
        where("resumeId", "==", resumeId),
        where("companyId", "==", companyId)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        toast.error("Assignment not found for this resume");
        return;
      }

      const assignmentDoc = snap.docs[0].ref;

      await updateDoc(assignmentDoc, { notes });

      // Optimistically update parent state
      setMetadata((prev) =>
        prev.map((item) => (item.id === resumeId ? { ...item, notes } : item))
      );

      onclick(); // close modal
      toast.success("Note added successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to add note");
    }
  };

  return (
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
          <h2 className="text-xl font-semibold mb-4">Add Note</h2>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-4"
          >
            <textarea
              
              onChange={(e) => setnotes(e.target.value)}
              placeholder="Write your note..."
              className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onclick}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={() => handleNotes(ID)}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Notes;
