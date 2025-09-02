/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";
import axios from "axios";
interface UploadJdModalProps {
  handleModalToggle: () => void;
  companyId:any,
  getjobs:()=>void;
}

const UploadJdModal: React.FC<UploadJdModalProps> = ({ handleModalToggle,companyId,getjobs }) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
   

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
   
  };

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!selectedFiles || selectedFiles.length === 0) {
    alert("Please select at least one file");
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFiles[0]);
  formData.append("companyId", companyId);

  handleModalToggle();

  const toastId = toast.loading("Uploading JD...");
  setLoading(true);

  try {
    const res = await axios.post("https://synthora-backend.onrender.com/api/uploadjd/file", formData, {
      onUploadProgress: (progressEvent) => {
        
        toast.loading(`Uploading JD...`, { id: toastId });
      },
    });

    toast.success("JD uploaded successfully!", { id: toastId });
    console.log("Upload success:", res.data);
    getjobs()
  } catch (err) {
    toast.error("Failed to upload files.", { id: toastId });
    console.error(err);
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-gradient-to-br from-[#eef2ff] to-[#dbeafe] rounded-3xl p-4 shadow-xl max-w-2xl w-full mx-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 w-full"
        >
          <h2 className="text-3xl font-bold text-center text-orange-500 mb-6">
            Upload Job Description
          </h2>

          <label
            htmlFor="fileUpload"
            className="flex flex-col items-center justify-center w-full h-30 border-2 border-dashed border-orange-400 rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 transition-all animate-glow"
          >
            <svg
              className="w-10 h-10 text-orange-500 mb-2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm text-orange-600 font-medium">
              Click or drag files/folders here
            </p>
            <p className="text-xs text-gray-500">(PDF, DOCX)</p>
          </label>

          <input
            type="file"
            id="fileUpload"
            className="hidden"
            
            onChange={handleFileChange}
            // TypeScript-safe way to set webkitdirectory attributes
            
          />

          {selectedFiles && (
            <div className="mt-4 max-h-32 overflow-y-auto rounded-md border border-gray-300 p-2 bg-white">
              <p className="text-xs text-gray-600 mb-1 font-semibold">
                Selected Files:
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                {Array.from(selectedFiles).map((file, index) => (
                  <li key={index}>📄 {file.name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-5 mt-6">
            <button
              type="submit"
              className="flex-1/2 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              onClick={handleModalToggle}
              className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadJdModal;
