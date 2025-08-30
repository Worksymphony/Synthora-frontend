import React, { useState } from 'react';
  type UploadModalProps = {
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleModalToggle:(event:React.FormEvent)=> void;
  handleSubmit:(event:React.FormEvent)=>void;
  loading:boolean
  selectedFiles:FileList | null
  
};
const UploadModal: React.FC<UploadModalProps> = ({handleFileChange,handleSubmit,handleModalToggle,loading,selectedFiles}) => {
  


    return <div>
       
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
    <div className="bg-gradient-to-br from-[#eef2ff] to-[#dbeafe] rounded-3xl p-4 shadow-xl max-w-2xl w-full mx-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 w-full"
      >
        <h2 className="text-3xl font-bold text-center text-orange-800 mb-6">Upload Resumes</h2>

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
          <p className="text-sm text-orange-600 font-medium">Click or drag folders here</p>
          <p className="text-xs text-gray-500">(PDF, DOCX)</p>
        </label>

        <input
          type="file"
          id="fileUpload"
          className="hidden"
          multiple
          onChange={handleFileChange}
          ref={(input) => {
            if (input) {
              input.setAttribute('webkitdirectory', '');
              input.setAttribute('directory', '');
            }
          }}
        />

        {selectedFiles && (
          <div className="mt-4 max-h-32 overflow-y-auto rounded-md border border-gray-300 p-2 bg-white">
            <p className="text-xs text-gray-600 mb-1 font-semibold">Selected Files:</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {Array.from(selectedFiles).map((file, index) => (
                <li key={index}>📄 {file.name}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <button
        type="submit"
        className="bg-orange-500 flex-1/2 text-white px-4 py-2 rounded"
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
      
    </div>;
}



export default UploadModal;