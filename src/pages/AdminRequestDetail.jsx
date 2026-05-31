import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
	ChevronLeft,
	FileText,
	CheckCircle,
	XCircle,
	Loader2,
	Download,
	AlertCircle,
	IndianRupee,
	Banknote,
	Clock,
} from "lucide-react";
import { api } from "../api";

const AdminRequestDetail = () => {
	const { requestId } = useParams();
	const navigate = useNavigate();
	const [request, setRequest] = useState(null);
	const [loading, setLoading] = useState(true);
	const [processing, setProcessing] = useState(false);
	const [paymentProcessing, setPaymentProcessing] = useState(false);
	const [notesSaving, setNotesSaving] = useState(false);
	const [adminNote, setAdminNote] = useState("");
	const [referrerNote, setReferrerNote] = useState("");

	useEffect(() => {
		fetchRequest();
	}, [requestId]);

	const fetchRequest = async () => {
		try {
			const res = await api.getAdminReferralRequest(requestId);
			setRequest(res.data);
			if (res.data.admin_note) {
				setAdminNote(res.data.admin_note);
			}
			if (res.data.referrer_note) {
				setReferrerNote(res.data.referrer_note);
			}
		} catch (err) {
			console.error(err);
			alert("Failed to load request details");
			navigate("/admin/referral-requests");
		} finally {
			setLoading(false);
		}
	};

	const handleAction = async (decision) => {
		if (decision === "rejected" && !adminNote.trim()) {
			alert(
				"Please consider adding a reason for rejection in the Admin Note box.",
			);
			if (!window.confirm("Submit rejection without a note?")) return;
		} else {
			if (
				!window.confirm(
					`Are you sure you want to ${decision} Request #${requestId}?`,
				)
			) {
				return;
			}
		}

		setProcessing(true);
		try {
			await api.updateAdminReferralRequestDecision(requestId, {
				decision,
				admin_note: adminNote,
				referrer_note: referrerNote,
			});
			if (decision === "approved") {
				alert(
					`Request approved. ₹${parseFloat(request.commission_amount).toLocaleString("en-IN")} commission added to ${request.referrer_name}'s earnings.`,
				);
			} else {
				alert(`Request rejected.`);
			}
			fetchRequest();
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.error || `Failed to ${decision} request`);
		} finally {
			setProcessing(false);
		}
	};

	const handleSaveNotes = async () => {
		setNotesSaving(true);
		try {
			await api.updateAdminReferralRequestNotes(requestId, {
				admin_note: adminNote,
				referrer_note: referrerNote,
			});
			alert("Notes saved!");
			fetchRequest();
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.error || "Failed to save notes");
		} finally {
			setNotesSaving(false);
		}
	};

	const handlePaymentToggle = async () => {
		const newStatus = request.payment_status === "paid" ? "unpaid" : "paid";
		const label = newStatus === "paid" ? "mark as Paid" : "revert to Unpaid";
		if (
			!window.confirm(
				`Are you sure you want to ${label} for Request #${requestId}?`,
			)
		)
			return;

		setPaymentProcessing(true);
		try {
			const res = await api.updateAdminReferralRequestPayment(requestId, {
				payment_status: newStatus,
			});
			setRequest((prev) => ({
				...prev,
				payment_status: newStatus,
				paid_at: res.data.paid_at ?? null,
			}));
		} catch (err) {
			console.error(err);
			alert(err.response?.data?.error || "Failed to update payment status");
		} finally {
			setPaymentProcessing(false);
		}
	};

	const openDocument = async (docId) => {
		try {
			const url = api.getAdminRequestDocumentUrl(requestId, docId);
			const token = localStorage.getItem("token");
			const response = await fetch(url, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) throw new Error("Failed to fetch document");

			const blob = await response.blob();
			const blobUrl = URL.createObjectURL(blob);

			const contentType = response.headers.get("content-type");
			if (
				contentType &&
				(contentType.includes("spreadsheet") || contentType.includes("excel"))
			) {
				const a = document.createElement("a");
				a.href = blobUrl;
				a.download = `document_${docId}.xlsx`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			} else {
				window.open(blobUrl, "_blank");
			}
		} catch (err) {
			console.error(err);
			alert("Could not load document.");
		}
	};

	if (loading || !request) {
		return (
			<div className="flex justify-center items-center h-screen">
				<Loader2 className="animate-spin text-indigo-600" size={40} />
			</div>
		);
	}

	const isPending = request.status === "pending";
	const isApproved = request.status === "approved";
	const isPaid = request.payment_status === "paid";

	const groupedDocuments = (request.documents || []).reduce((acc, doc) => {
		const group =
			doc.month_index !== null
				? `Month ${doc.month_index}`
				: "General Documents";
		if (!acc[group]) acc[group] = [];
		acc[group].push(doc);
		return acc;
	}, {});

	return (
		<div className="container mx-auto px-4 py-8 max-w-6xl">
			<button
				onClick={() => navigate("/admin/referral-requests")}
				className="flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-6">
				<ChevronLeft size={16} className="mr-1" /> Back to Requests
			</button>

			<div className="flex justify-between items-center mb-6">
				<h1 className="text-3xl font-bold text-gray-900">
					Request #{request.id}
				</h1>
			</div>

			{/* Summary Row */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
				<div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
					<p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
						Plan Details
					</p>
					<h3 className="font-bold text-gray-900 text-lg">
						{request.plan_name}
					</h3>
					<p className="text-sm text-indigo-600">{request.category_name}</p>
				</div>

				<div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col justify-center">
					<div className="flex items-baseline mb-1">
						<span className="text-sm text-gray-500 line-through mr-2">
							₹{parseFloat(request.original_price).toLocaleString("en-IN")}
						</span>
						<span className="text-lg font-bold text-gray-900">
							₹{parseFloat(request.discounted_price).toLocaleString("en-IN")}
						</span>
					</div>
					<div className="text-sm font-medium text-green-600 flex items-center bg-green-50 w-max px-2 py-1 rounded">
						<IndianRupee size={14} className="mr-1" /> Commission: ₹
						{parseFloat(request.commission_amount).toLocaleString("en-IN")}
					</div>
				</div>

				<div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex flex-col justify-center items-start">
					<p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
						Current Status
					</p>
					{isApproved && (
						<span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center">
							<CheckCircle size={16} className="mr-2" /> Approved
						</span>
					)}
					{request.status === "rejected" && (
						<span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 flex items-center">
							<XCircle size={16} className="mr-2" /> Rejected
						</span>
					)}
					{isPending && (
						<span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
							Pending Review
						</span>
					)}
					{!isPending && request.reviewed_at && (
						<p className="text-xs text-gray-500 mt-2">
							on {new Date(request.reviewed_at).toLocaleDateString("en-IN")}
						</p>
					)}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Left Col: Details & Docs */}
				<div className="lg:col-span-2 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100">
							<h2 className="text-sm font-bold text-indigo-900 mb-3 uppercase tracking-wider border-b border-indigo-200 pb-2">
								Referrer Info
							</h2>
							<p className="font-medium text-gray-900">
								{request.referrer_name}
							</p>
							<p className="text-sm text-gray-600">{request.referrer_mobile}</p>
							<p className="text-sm text-gray-600">{request.referrer_email}</p>
							<button
								onClick={() =>
									navigate(`/admin/referrers/${request.referrer_id}`)
								}
								className="mt-3 text-xs font-semibold text-indigo-700 hover:underline">
								View Referrer Profile &rarr;
							</button>
						</div>
						<div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
							<h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider border-b border-gray-200 pb-2">
								Customer Info
							</h2>
							<p className="font-medium text-gray-900">
								{request.customer_name}
							</p>
							{request.customer_mobile && (
								<p className="text-sm text-gray-600">
									Ph: {request.customer_mobile}
								</p>
							)}
							<p className="text-sm text-gray-500 mt-2">
								Submitted:{" "}
								{new Date(request.created_at).toLocaleString("en-IN")}
							</p>
						</div>
					</div>

					<div className="bg-white shadow rounded-lg p-6 border border-gray-100">
						<h2 className="text-xl font-semibold mb-6">Uploaded Documents</h2>

						<div className="space-y-8">
							{Object.entries(groupedDocuments).map(([groupName, docs]) => (
								<div key={groupName} className="space-y-4">
									{groupName !== "General Documents" && (
										<h4 className="font-medium text-slate-700 bg-slate-100 py-1.5 px-3 rounded-md inline-block text-sm">
											{groupName}
										</h4>
									)}

									<div className="grid grid-cols-1 gap-4">
										{docs.map((doc) => (
											<div
												key={doc.id}
												className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
												<div>
													<div className="flex items-center mb-1">
														<span className="font-medium text-gray-900 mr-2">
															{doc.label}
														</span>
														<span
															className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${doc.field_type === "pdf" ? "bg-red-100 text-red-700" : doc.field_type === "text" ? "bg-gray-200 text-gray-700" : "bg-green-100 text-green-700"}`}>
															{doc.field_type}
														</span>
													</div>
													{doc.field_type === "text" && (
														<p className="text-sm text-gray-600 bg-white border px-3 py-2 rounded mt-2 font-mono">
															"{doc.text_value}"
														</p>
													)}
												</div>

												{doc.field_type !== "text" &&
													((doc.has_file || doc.file_path) ? (
														<button
															onClick={() => openDocument(doc.id)}
															className="text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-600 px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center">
															<Download size={16} className="mr-2" /> View File
														</button>
													) : (
														<span className="text-sm text-red-500 flex items-center">
															<AlertCircle size={14} className="mr-1" /> Missing
														</span>
													))}
											</div>
										))}
									</div>
								</div>
							))}

							{request.documents?.length === 0 && (
								<p className="text-gray-500 italic">
									No documents required for this request.
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Right Col: Decision + Payment */}
				<div className="lg:col-span-1 space-y-4">
					{/* Decision Panel */}
					<div className="bg-white shadow rounded-lg p-6 border border-gray-100 sticky top-6">
						<h2 className="text-lg font-semibold mb-4">Decision Panel</h2>

						{!isPending && (
							<div
								className={`p-4 rounded-md mb-4 text-sm ${isApproved ? "bg-green-50 border border-green-100 text-green-800" : "bg-red-50 border border-red-100 text-red-800"}`}>
								<p className="font-semibold mb-1">
									Status: {request.status.toUpperCase()}
								</p>
							</div>
						)}

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Admin Note (Internal)
								</label>
								<textarea
									value={adminNote}
									onChange={(e) => setAdminNote(e.target.value)}
									rows="4"
									className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="Enter internal admin notes..."></textarea>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Note for Referrer
								</label>
								<textarea
									value={referrerNote}
									onChange={(e) => setReferrerNote(e.target.value)}
									rows="3"
									className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="Enter notes visible to the referrer..."></textarea>
							</div>
							{isPending ? (
								<div className="flex flex-col gap-3 pt-2">
									<button
										disabled={processing}
										onClick={() => handleAction("approved")}
										className="w-full bg-green-600 text-white py-3 rounded-md font-bold hover:bg-green-700 disabled:opacity-50 shadow-sm">
										{processing ? "Processing..." : "Approve Request"}
									</button>
									<button
										disabled={processing}
										onClick={() => handleAction("rejected")}
										className="w-full border-2 border-red-200 text-red-600 py-2 rounded-md font-medium hover:bg-red-50 disabled:opacity-50">
										{processing ? "Processing..." : "Reject"}
									</button>
								</div>
							) : (
								<button
									disabled={notesSaving}
									onClick={handleSaveNotes}
									className="w-full bg-indigo-600 text-white py-2 rounded-md font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-sm">
									{notesSaving ? "Saving..." : "Save Notes"}
								</button>
							)}
						</div>
					</div>

					{/* Payment Status Panel — only visible for approved requests */}
					{isApproved && (
						<div className="bg-white shadow rounded-lg p-6 border border-gray-100">
							<h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
								<Banknote size={20} className="text-emerald-600" />
								Commission Payment
							</h2>
							<p className="text-xs text-gray-400 mb-5">
								Track whether the referrer's commission has been paid out.
							</p>

							{/* Payment badge + date */}
							<div className="flex items-center gap-3 mb-1">
								{isPaid ? (
									<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
										<CheckCircle size={15} />
										Paid
									</span>
								) : (
									<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-200">
										<Clock size={15} />
										Unpaid
									</span>
								)}
								<span className="text-sm text-gray-500">
									₹{parseFloat(request.commission_amount).toLocaleString("en-IN")}
								</span>
							</div>
							{isPaid && request.paid_at && (
								<p className="text-xs text-emerald-700 mb-5 pl-1">
									Paid on{" "}
									{new Date(request.paid_at).toLocaleString("en-IN", {
										day: "2-digit",
										month: "short",
										year: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
							)}
							{!isPaid && <div className="mb-5" />}

							{/* Toggle button */}
							<button
								onClick={handlePaymentToggle}
								disabled={paymentProcessing}
								className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2
                  ${
										isPaid
											? "bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100"
											: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
									}`}>
								{paymentProcessing ? (
									<>
										<Loader2 size={16} className="animate-spin" /> Updating…
									</>
								) : isPaid ? (
									<>
										<Clock size={16} /> Revert to Unpaid
									</>
								) : (
									<>
										<CheckCircle size={16} /> Mark as Paid
									</>
								)}
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default AdminRequestDetail;
