import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
	(config) => {
		const isReferrerApp = !window.location.pathname.startsWith("/admin");
		const token = isReferrerApp
			? localStorage.getItem("referrer_token")
			: localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		// ignore login response
		if (
			error.config.url === "/login" ||
			error.config.url === "/referrer/login"
		) {
			return Promise.reject(error);
		}

		if (error.response?.status === 401) {
			const isReferrerApp = !window.location.pathname.startsWith("/admin");
			if (isReferrerApp) {
				localStorage.removeItem("referrer_token");
				window.location.href = "/";
			} else {
				localStorage.removeItem("token");
				window.location.href = "/admin/login";
			}
		}
		return Promise.reject(error);
	},
);

export const api = {
	// User authentication
	register: (userData) => axiosInstance.post("/register", userData),
	login: (credentials) => axiosInstance.post("/login", credentials),

	// Referrer endpoints
	referrerRegister: (data) => axiosInstance.post("/referrer/register", data),
	referrerLogin: (credentials) =>
		axiosInstance.post("/referrer/login", credentials),
	getServiceCategories: () => axiosInstance.get("/services/categories"),
	getServicePlans: (categoryId) =>
		axiosInstance.get(
			`/services/plans${categoryId ? `?category_id=${categoryId}` : ""}`,
		),
	getPlanRequirements: (planId) =>
		axiosInstance.get(`/services/plans/${planId}/requirements`),
	submitReferralRequest: (data) =>
		axiosInstance.post("/referrer/requests", data),
	getReferralRequests: (status) =>
		axiosInstance.get(
			`/referrer/requests${status && status !== "all" ? `?status=${status}` : ""}`,
		),
	getReferralRequest: (id) => axiosInstance.get(`/referrer/requests/${id}`),
	getEarnings: () => axiosInstance.get("/referrer/earnings"),
	getReferrerProfile: () => axiosInstance.get("/referrer/profile"),

	// Admin Referrer & Request endpoints
	getAdminReferrers: (status, page, limit) =>
		axiosInstance.get(
			`/admin/referrers?status=${status || ""}&page=${page || 1}&limit=${limit || 20}`,
		),
	getAdminReferrer: (id) => axiosInstance.get(`/admin/referrers/${id}`),
	updateAdminReferrerStatus: (id, payload) =>
		axiosInstance.put(`/admin/referrers/${id}/status`, payload),
	updateAdminReferrerNote: (id, payload) =>
		axiosInstance.put(`/admin/referrers/${id}/note`, payload),
	deleteAdminReferrer: (id) => axiosInstance.delete(`/admin/referrers/${id}`),
	getAdminReferrerDocumentUrl: (id, docType) =>
		`${API_URL}/admin/referrers/${id}/documents/${docType}`, // For hrefs or blob fetching

	getAdminReferralRequests: (
		status,
		plan_id,
		referrer_id,
		payment_status,
		page,
		limit,
	) => {
		const query = new URLSearchParams();
		if (status && status !== "all") query.append("status", status);
		if (plan_id) query.append("plan_id", plan_id);
		if (referrer_id) query.append("referrer_id", referrer_id);
		if (payment_status && payment_status !== "all")
			query.append("payment_status", payment_status);
		query.append("page", page || 1);
		query.append("limit", limit || 20);
		return axiosInstance.get(`/admin/requests?${query.toString()}`);
	},
	getAdminReferralRequest: (id) => axiosInstance.get(`/admin/requests/${id}`),
	updateAdminReferralRequestDecision: (id, payload) =>
		axiosInstance.put(`/admin/requests/${id}/decision`, payload),
	updateAdminReferralRequestPayment: (id, payload) =>
		axiosInstance.put(`/admin/requests/${id}/payment`, payload),
	updateAdminReferralRequestNotes: (id, payload) =>
		axiosInstance.put(`/admin/requests/${id}/notes`, payload),
	getAdminRequestDocumentUrl: (id, docId) =>
		`${API_URL}/admin/requests/${id}/documents/${docId}`,

	// Protected routes
	profile: () => axiosInstance.get("/profile"),
	getStorageUsage: () => axiosInstance.get(`/storage`),

	// Client routes
	getClients: () => axiosInstance.get("/clients"),
	createClient: (clientData) => axiosInstance.post("/clients", clientData),
	getClient: (id) => axiosInstance.get(`/clients/${id}`),
	updateClient: (id, clientData) =>
		axiosInstance.put(`/clients/${id}`, clientData),
	deleteClient: (id) => axiosInstance.delete(`/clients/${id}`),
	completeClient: (id, is_completed) =>
		axiosInstance.put(`/clients/${id}/complete`, { is_completed }),

	// Client folder routes
	getClientFolders: (clientId) =>
		axiosInstance.get(`/clients/${clientId}/folders`),
	createClientFolder: (clientId, folderData) =>
		axiosInstance.post(`/clients/${clientId}/folders`, folderData),
	getClientFolder: (clientId, folderId) =>
		axiosInstance.get(`/clients/${clientId}/folders/${folderId}`),
	updateClientFolder: (clientId, folderId, folderData) =>
		axiosInstance.put(`/clients/${clientId}/folders/${folderId}`, folderData),
	deleteClientFolder: (clientId, folderId) =>
		axiosInstance.delete(`/clients/${clientId}/folders/${folderId}`),

	// File routes
	getClientFolderFiles: (clientId, folderId) =>
		axiosInstance.get(`/clients/${clientId}/folders/${folderId}/files`),
	uploadFile: (clientId, folderId, fileData) =>
		axiosInstance.post(
			`/clients/${clientId}/folders/${folderId}/files`,
			fileData,
		),
	downloadFile: (clientId, folderId, fileId) =>
		axiosInstance.get(
			`/clients/${clientId}/folders/${folderId}/files/${fileId}`,
			{ responseType: "blob" },
		),
	deleteFile: (clientId, folderId, fileId) =>
		axiosInstance.delete(
			`/clients/${clientId}/folders/${folderId}/files/${fileId}`,
		),
	renameFile: (clientId, folderId, fileId, newFileName) =>
		axiosInstance.put(
			`/clients/${clientId}/folders/${folderId}/files/${fileId}`,
			{ newFileName },
		),

	// Shared folder routes
	generateShareLink: (clientId, folderId) =>
		axiosInstance.post(`/clients/${clientId}/folders/${folderId}/share`),
	getSharedFolder: (code) => axiosInstance.get(`/shared/folder/${code}`),
	downloadFileFromShare: (code, fileId) =>
		axiosInstance.get(`/shared/folder/${code}/files/${fileId}`, {
			responseType: "blob",
		}),
};
