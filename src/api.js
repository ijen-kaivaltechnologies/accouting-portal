import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const api = {
    // User authentication
    register: (userData) => axiosInstance.post('/register', userData),
    login: (credentials) => axiosInstance.post('/login', credentials),
    
    // Protected routes
    profile: () => axiosInstance.get('/profile'),

    // Client routes
    getClients: () => axiosInstance.get('/clients'),
    createClient: (clientData) => axiosInstance.post('/clients', clientData),
    getClient: (id) => axiosInstance.get(`/clients/${id}`),
    updateClient: (id, clientData) => axiosInstance.put(`/clients/${id}`, clientData),
    deleteClient: (id) => axiosInstance.delete(`/clients/${id}`),

    // Client folder routes
    getClientFolders: (clientId) => axiosInstance.get(`/clients/${clientId}/folders`),
    createClientFolder: (clientId, folderData) => axiosInstance.post(`/clients/${clientId}/folders`, folderData),
    getClientFolder: (clientId, folderId) => axiosInstance.get(`/clients/${clientId}/folders/${folderId}`),
    updateClientFolder: (clientId, folderId, folderData) => axiosInstance.put(`/clients/${clientId}/folders/${folderId}`, folderData),
    deleteClientFolder: (clientId, folderId) => axiosInstance.delete(`/clients/${clientId}/folders/${folderId}`),

    // File routes
    getClientFolderFiles: (clientId, folderId) => axiosInstance.get(`/clients/${clientId}/folders/${folderId}/files`),
    uploadFile: (clientId, folderId, fileData) => axiosInstance.post(`/clients/${clientId}/folders/${folderId}/files`, fileData),
    downloadFile: (clientId, folderId, fileId) => axiosInstance.get(`/clients/${clientId}/folders/${folderId}/files/${fileId}`, { responseType: 'blob' }),
    deleteFile: (clientId, folderId, fileId) => axiosInstance.delete(`/clients/${clientId}/folders/${folderId}/files/${fileId}`),
    renameFile: (clientId, folderId, fileId, newFileName) => axiosInstance.put(`/clients/${clientId}/folders/${folderId}/files/${fileId}`, { newFileName }),

    // Shared folder routes
    generateShareLink: (clientId, folderId) => axiosInstance.post(`/clients/${clientId}/folders/${folderId}/share`),
    getSharedFolder: (code) => axiosInstance.get(`/shared/folder/${code}`),
    downloadFileFromShare: (code, fileId) => axiosInstance.get(`/shared/folder/${code}/files/${fileId}`, { responseType: 'blob' }),
};