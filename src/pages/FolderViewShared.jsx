import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Download, ChevronLeft } from "lucide-react";
import { api } from "../api";

function FolderViewShared() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [expiry, setExpiry] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSharedFolder();
  }, [code]);

  const fetchSharedFolder = async () => {
    try {
      setLoading(true);
      const response = await api.getSharedFolder(code);
      if (response.data.success) {
        setFiles(response.data.files);
        setExpiry(response.data.expiry);
      }
    } catch (error) {
      console.error("Error fetching shared folder:", error);
      alert("Failed to fetch folder. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await api.downloadFileFromShare(code, fileId);
      const blob = new Blob([response.data], {
        type: "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = files.find((file) => file.id === fileId).name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const formatExpiry = (expiry) => {
    const date = new Date(expiry);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Shared Folder</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition duration-150 ease-in-out flex items-center"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Back
        </button>
      </div>

      {expiry && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">
            This link will expire on: {formatExpiry(expiry)}
          </p>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">No files in this folder</p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.name}
                className="p-6 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {file.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {file.size} • {file.last_modified}
                    </p>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => handleDownload(file.id)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default FolderViewShared;