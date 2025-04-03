import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Folder, Plus, Link as LinkIcon, ChevronLeft, Pencil, Trash2 } from 'lucide-react';
import { api } from '../api';

function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, [userId]);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const response = await api.getClientFolders(userId);
      setFolders(response.data);
    } catch (error) {
      console.error('Error fetching folders:', error);
      alert('Failed to fetch folders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      setLoading(true);
      await api.createClientFolder(userId, { folderName: newFolderName });
      await fetchFolders();
      setNewFolderName('');
      setShowNewFolderDialog(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.folder_name);
    setShowNewFolderDialog(true);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return;

    try {
      setLoading(true);
      await api.updateClientFolder(userId, editingFolder.id, { folderName: newFolderName });
      await fetchFolders();
      setEditingFolder(null);
      setNewFolderName('');
      setShowNewFolderDialog(false);
    } catch (error) {
      console.error('Error updating folder:', error);
      alert('Failed to update folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('Are you sure you want to delete this folder?')) return;

    try {
      setLoading(true);
      await api.deleteClientFolder(userId, folderId);
      await fetchFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateShareableLink = async (folderId) => {
    try {
      setLoading(true);
      const response = await api.generateShareLink(userId, folderId);
      if (response.data.success) {
        // Copy to clipboard
        navigator.clipboard.writeText(response.data.share_url)
          .then(() => alert("Shareable link copied to clipboard!"))
          .catch(() => alert("Failed to copy link. Please copy manually."));
      }
    } catch (error) {
      console.error("Error generating share link:", error);
      alert("Failed to generate share link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="h-5 w-5 mr-1" />
        Back to Users
      </button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User's Folders</h1>
        <button
          onClick={() => {
            setEditingFolder(null);
            setShowNewFolderDialog(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 ease-in-out"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Folder
        </button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map((folder) => (
            <div key={folder.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <Folder className="h-8 w-8 text-indigo-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{folder.folder_name}</h3>
                    <p className="text-sm text-gray-500">Created: {new Date(folder.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => navigate(`/user/${userId}/folder/${folder.id}`)}
                  className="flex-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-md hover:bg-indigo-100 transition duration-150 ease-in-out"
                >
                  View Files
                </button>
                <button
                  onClick={() => generateShareableLink(folder.id)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition duration-150 ease-in-out"
                >
                  <LinkIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleEditFolder(folder)}
                  className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition duration-150 ease-in-out"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="flex items-center justify-center w-10 h-10 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition duration-150 ease-in-out"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingFolder ? 'Edit Folder' : 'Create New Folder'}
            </h2>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setShowNewFolderDialog(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={editingFolder ? handleUpdateFolder : handleCreateFolder}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? 'Processing...' : editingFolder ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDetails;