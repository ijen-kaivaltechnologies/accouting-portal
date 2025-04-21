import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Users, LogOut, Plus, Trash2, Pencil, Search } from "lucide-react";
import { api } from "../api";

function UserList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editClientId, setEditClientId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    groupName: "",
    mobileNumber: "",
    city: "",
  });
  const [allClients, setAllClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState([]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filteredClients = allClients.filter((client) => {
      const fullName = `${client.first_name} ${client.last_name}`;
      return (
        fullName.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query)
      );
    });

    setClients(filteredClients);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.mobileNumber ||
      !formData.city
    ) {
      alert("First name, last name, mobile number, and city are required.");
      setLoading(false);
      return;
    }
    // Validate mobile number
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      alert("Mobile number must be 10 digits.");
      setLoading(false);
      return;
    }
    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      await api.createClient(formData);
      setShowCreateForm(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        groupName: "",
        mobileNumber: "",
        city: "",
      });
      await fetchClients();
    } catch (error) {
      console.error("Error creating client:", error);
      alert("Failed to create client. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this client? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.deleteClient(clientId);
      await fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Failed to delete client. Please try again.");
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await api.getClients();
      setClients(response.data);
      setAllClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
      alert("Failed to fetch clients. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClient = (client) => {
    setFormData({
      firstName: client.first_name,
      lastName: client.last_name,
      email: client.email,
      groupName: client.group_name || "",
      mobileNumber: client.mobile_number || "",
      city: client.city || "",
      is_active: client.is_active,
    });
    setEditClientId(client.id);
    setShowEditForm(true);
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.mobileNumber ||
      !formData.city
    ) {
      alert("First name, last name, mobile number, and city are required.");
      setLoading(false);
      return;
    }
    // Validate mobile number
    if (!/^\d{10}$/.test(formData.mobileNumber)) {
      alert("Mobile number must be 10 digits.");
      setLoading(false);
      return;
    }
    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      await api.updateClient(editClientId, formData);
      setShowEditForm(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        groupName: "",
        mobileNumber: "",
        city: "",
      });
      setEditClientId(null);
      await fetchClients();
    } catch (error) {
      console.error("Error updating client:", error);
      let msg = error.message;

      if(error?.response?.data?.error) {
        msg = error.response.data.error;
      }

      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-indigo-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search clients..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center text-sm font-medium text-red-600 hover:text-red-900 transition duration-150 ease-in-out"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="groupName"
                className="block text-sm font-medium text-gray-700"
              >
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                name="groupName"
                value={formData.groupName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="mobileNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Mobile Number
              </label>
              <input
                type="text"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700"
              >
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Client"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEditForm && (
        <div className="mb-8">
          <form onSubmit={handleUpdateClient} className="space-y-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="groupName"
                className="block text-sm font-medium text-gray-700"
              >
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                name="groupName"
                value={formData.groupName}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="mobileNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Mobile Number
              </label>
              <input
                type="text"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700"
              >
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="isActive"
                className="block text-sm font-medium text-gray-700"
              >
                Active
              </label>
              <select
                id="isActive"
                name="is_active"
                value={formData.is_active}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setEditClientId(null);
                  setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Client"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sr
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client, index) => (
              <tr key={client.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {index + 1}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap max-w-xl">
                    <div className="text-sm font-medium text-gray-900 break-words whitespace-normal">
                    {client.first_name} {client.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap max-w-xl">
                    <div className="text-sm font-medium text-gray-900 break-words whitespace-normal">
                    {client.group_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap max-w-xl">
                    <div className="text-sm font-medium text-gray-900 break-words whitespace-normal">
                    {client.mobile_number}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap max-w-xl">
                    <div className="text-sm font-medium text-gray-900 break-words whitespace-normal">
                    {client.city}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap max-w-xl">
                  <div className="text-sm text-gray-500 max-w-xl break-words whitespace-normal">{client.email}</div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap max-w-xl">
                  <div className="text-sm text-gray-500 max-w-xl break-words whitespace-normal break-words whitespace-normal">
                    {new Date(client.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium max-w-xl">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigate(`/user/${client.id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditClient(client)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserList;
