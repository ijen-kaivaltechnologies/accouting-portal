import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  Download,
  Link as LinkIcon,
  File,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { api } from "../api";

function FolderView() {
  const { userId, folderId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [newFileName, setNewFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, [folderId]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await api.getClientFolderFiles(userId, folderId);
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files:", error);
      alert("Failed to fetch files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    const file = selectedFile;
    if (!file) return;

    try {
      setLoading(true);
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(",")[1];
        await api.uploadFile(userId, folderId, {
          file: base64Data,
          fileName: file.name,
        });
        await fetchFiles();
        setShowUploadDialog(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await api.downloadFile(userId, folderId, fileId);
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

  const handleEditFile = (file) => {
    setEditingFile(file);
    setNewFileName(file.name);
    setShowUploadDialog(true);
  };

  const handleUpdateFile = async () => {
    if (!editingFile || !newFileName.trim()) return;

    try {
      setLoading(true);
      await api.renameFile(userId, folderId, editingFile.id, newFileName);
      await fetchFiles();
      setEditingFile(null);
      setNewFileName("");
      setShowUploadDialog(false);
    } catch (error) {
      let errorMessage = "Failed to update file. Please try again.";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      console.error("Error updating file:", error);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      setLoading(true);
      await api.deleteFile(userId, folderId, fileId);
      await fetchFiles();
    } catch (error) {
      let errorMessage = "Failed to delete file. Please try again.";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      console.error("Error deleting file:", error);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateShareLink = async () => {
    try {
      setLoading(true);
      const response = await api.generateShareLink(userId, folderId);
      if (response.data.success) {
        setShareLink(response.data.share_url);
        // Copy to clipboard
        navigator.clipboard.writeText(response.data.share_url)
          .then(() => alert("Shareable link copied to clipboard!"))
          .catch(() => alert("Failed to copy link. Please copy manually."));
      }
    } catch (error) {
      let errorMessage = "Failed to generate share link. Please try again.";
      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      }
      console.error("Error generating share link:", error);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(`/user/${userId}`)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        Back to Folders
      </button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Folder Contents</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setEditingFile(null);
              setShowUploadDialog(true);
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out"
          >
            <Plus className="h-5 w-5 mr-2" />
            Upload File
          </button>
          <button
            onClick={() => generateShareLink()}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out"
          >
            <LinkIcon className="h-5 w-5 mr-2" />
            Share Folder
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      )}

      {!loading && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200">
            {files.map((file) => (
              <div
                key={file.name}
                className="p-6 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <File className="h-8 w-8 text-indigo-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {file.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {file.size} • {file.lastModified}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDownload(file.id)}
                    className="flex items-center px-4 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition duration-150 ease-in-out"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={() => handleEditFile(file)}
                    className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition duration-150 ease-in-out"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.id)}
                    className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition duration-150 ease-in-out"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingFile ? "Rename File" : "Upload New File"}
            </h2>
            {!editingFile && (
              <div className="mb-4">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                file:hover:bg-indigo-600 file:hover:text-white
                                file:transition-colors file:duration-200"
                />
              </div>
            )}

            {editingFile && (
              <div className="mb-4">
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Enter new file name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingFile(null);
                  setNewFileName("");
                  setShowUploadDialog(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={
                  editingFile
                    ? handleUpdateFile
                    : handleFileUpload
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out"
              >
                {loading ? "Loading..." : editingFile ? "Update" : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FolderView;
