import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
	Loader2,
	Filter,
	ChevronRight,
	FileText,
	CheckCircle,
	XCircle,
	Clock,
	Banknote,
	ChevronLeft,
} from "lucide-react";
import { api } from "../api";

const StatusBadge = ({ status }) => {
	const m = {
		approved: {
			bg: "#f0fdf4",
			color: "#16a34a",
			border: "#bbf7d0",
			Icon: CheckCircle,
			label: "Approved",
		},
		rejected: {
			bg: "#fef2f2",
			color: "#dc2626",
			border: "#fecaca",
			Icon: XCircle,
			label: "Rejected",
		},
	};
	const c = m[status] || {
		bg: "#fefce8",
		color: "#ca8a04",
		border: "#fde68a",
		Icon: Clock,
		label: "Pending",
	};
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: "4px",
				background: c.bg,
				color: c.color,
				border: `1px solid ${c.border}`,
				fontSize: "11px",
				fontWeight: "600",
				padding: "3px 9px",
				borderRadius: "20px",
			}}>
			<c.Icon size={11} />
			{c.label}
		</span>
	);
};

const PaymentBadge = ({ status, requestStatus }) => {
	if (requestStatus !== "approved")
		return <span style={{ color: "#cbd5e1", fontSize: "11px" }}>—</span>;
	const isPaid = status === "paid";
	return (
		<span
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: "4px",
				background: isPaid ? "#f0fdf4" : "#fffbeb",
				color: isPaid ? "#16a34a" : "#b45309",
				border: `1px solid ${isPaid ? "#bbf7d0" : "#fde68a"}`,
				fontSize: "11px",
				fontWeight: "600",
				padding: "3px 9px",
				borderRadius: "20px",
			}}>
			{isPaid ? <CheckCircle size={11} /> : <Clock size={11} />}
			{isPaid ? "Paid" : "Unpaid"}
		</span>
	);
};

const AdminRequests = () => {
	const navigate = useNavigate();
	const [statusFilter, setStatusFilter] = useState("all");
	const [planFilter, setPlanFilter] = useState("");
	const [paymentFilter, setPaymentFilter] = useState("all");
	const [requests, setRequests] = useState([]);
	const [allPlans, setAllPlans] = useState([]);
	const [loading, setLoading] = useState(true);
	const [pendingCount, setPendingCount] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [pageSize, setPageSize] = useState(20);

	useEffect(() => {
		fetchPlans();
	}, []);
	useEffect(() => {
		setCurrentPage(1); // reset page when filters change
		fetchRequests(statusFilter, planFilter, null, paymentFilter, 1);
		if (statusFilter !== "pending") fetchPendingCount();
	}, [statusFilter, planFilter, paymentFilter]);
	useEffect(() => {
		if (currentPage > 1) {
			fetchRequests(statusFilter, planFilter, null, paymentFilter, currentPage);
		}
	}, [currentPage]);

	const fetchPlans = async () => {
		try {
			const res = await api.getServicePlans();
			setAllPlans(res.data || []);
		} catch (err) {
			console.error(err);
		}
	};

	const fetchRequests = async (
		status,
		planId,
		referrerId,
		paymentStatus,
		page,
	) => {
		setLoading(true);
		try {
			const res = await api.getAdminReferralRequests(
				status,
				planId,
				referrerId,
				paymentStatus,
				page,
				pageSize,
			);
			setRequests(res.data.requests || []);
			setTotal(res.data.total || 0);
			if (status === "pending" && paymentStatus === "all")
				setPendingCount(res.data.total || 0);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const fetchPendingCount = async () => {
		try {
			const res = await api.getAdminReferralRequests(
				"pending",
				"",
				null,
				"all",
				1,
				1,
			);
			setPendingCount(res.data.total || 0);
		} catch (err) {
			console.error(err);
		}
	};

	const totalPages = Math.ceil(total / pageSize);

	return (
		<div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
			{/* Header */}
			<div
				style={{
					display: "flex",
					alignItems: "flex-start",
					justifyContent: "space-between",
					marginBottom: "24px",
					flexWrap: "wrap",
					gap: "12px",
				}}>
				<div>
					<h1
						style={{
							fontSize: "22px",
							fontWeight: "700",
							color: "#0f172a",
							letterSpacing: "-0.3px",
						}}>
						Referral Requests
					</h1>
					<p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
						Review and approve incoming referral submissions.
					</p>
				</div>
				{pendingCount > 0 && (
					<div
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: "8px",
							background: "#fefce8",
							border: "1px solid #fde68a",
							borderRadius: "10px",
							padding: "8px 14px",
						}}>
						<Clock size={14} style={{ color: "#ca8a04" }} />
						<span
							style={{ fontSize: "13px", fontWeight: "600", color: "#92400e" }}>
							{pendingCount} awaiting review
						</span>
					</div>
				)}
			</div>

			{/* Filters Row */}
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					alignItems: "center",
					gap: "16px",
					marginBottom: "18px",
				}}>
				{/* Status filter */}
				<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
					<span
						style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>
						Status:
					</span>
					<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
						{["all", "pending", "approved", "rejected"].map((f) => {
							const active = statusFilter === f;
							return (
								<button
									key={f}
									onClick={() => setStatusFilter(f)}
									style={{
										padding: "5px 13px",
										borderRadius: "8px",
										border: "none",
										cursor: "pointer",
										fontSize: "12px",
										fontWeight: "600",
										textTransform: "capitalize",
										background: active ? "#0f172a" : "#f1f5f9",
										color: active ? "white" : "#64748b",
										transition: "all 0.15s",
									}}
									onMouseEnter={(e) => {
										if (!active) e.currentTarget.style.background = "#e2e8f0";
									}}
									onMouseLeave={(e) => {
										if (!active) e.currentTarget.style.background = "#f1f5f9";
									}}>
									{f}
									{f === "pending" && pendingCount > 0
										? ` (${pendingCount})`
										: ""}
								</button>
							);
						})}
					</div>
				</div>

				{/* Payment filter */}
				<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
					<span
						style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>
						Payment:
					</span>
					<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
						{["all", "paid", "unpaid"].map((f) => {
							const active = paymentFilter === f;
							return (
								<button
									key={f}
									onClick={() => setPaymentFilter(f)}
									style={{
										padding: "5px 13px",
										borderRadius: "8px",
										border: "none",
										cursor: "pointer",
										fontSize: "12px",
										fontWeight: "600",
										textTransform: "capitalize",
										background: active ? "#6366f1" : "#f1f5f9",
										color: active ? "white" : "#64748b",
										transition: "all 0.15s",
									}}
									onMouseEnter={(e) => {
										if (!active) e.currentTarget.style.background = "#e2e8f0";
									}}
									onMouseLeave={(e) => {
										if (!active) e.currentTarget.style.background = "#f1f5f9";
									}}>
									{f}
								</button>
							);
						})}
					</div>
				</div>

				{/* Plan filter */}
				<select
					value={planFilter}
					onChange={(e) => setPlanFilter(e.target.value)}
					style={{
						padding: "6px 12px",
						background: "white",
						border: "1px solid #e2e8f0",
						borderRadius: "8px",
						fontSize: "12px",
						color: "#374151",
						outline: "none",
						cursor: "pointer",
					}}>
					<option value="">All Plans</option>
					{allPlans.map((p) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</select>
			</div>

			{/* Table */}
			<div
				style={{
					background: "white",
					borderRadius: "14px",
					border: "1px solid #e2e8f0",
					overflow: "hidden",
					minHeight: "300px",
				}}>
				{loading ? (
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "200px",
						}}>
						<Loader2
							size={26}
							style={{ color: "#6366f1", animation: "spin 1s linear infinite" }}
						/>
					</div>
				) : requests.length === 0 ? (
					<div style={{ padding: "56px 24px", textAlign: "center" }}>
						<div
							style={{
								width: "52px",
								height: "52px",
								background: "#f8fafc",
								borderRadius: "12px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								margin: "0 auto 14px",
							}}>
							<FileText size={22} style={{ color: "#cbd5e1" }} />
						</div>
						<p
							style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
							No requests found
						</p>
						<p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
							No referral requests match the current filters.
						</p>
					</div>
				) : (
					<>
						<div style={{ overflowX: "auto" }}>
							<table style={{ width: "100%", borderCollapse: "collapse" }}>
								<thead>
									<tr style={{ background: "#f8fafc" }}>
										{[
											"#",
											"Referrer",
											"Plan",
											"Customer",
											"Submitted",
											"Status",
											"Payment",
											"",
										].map((h, i) => (
											<th
												key={i}
												style={{
													padding: "10px 18px",
													textAlign: i === 7 ? "right" : "left",
													fontSize: "11px",
													fontWeight: "600",
													color: "#94a3b8",
													textTransform: "uppercase",
													letterSpacing: "0.05em",
													borderBottom: "1px solid #f1f5f9",
													whiteSpace: "nowrap",
												}}>
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{requests.map((req, i) => (
										<tr
											key={req.request_id}
											style={{
												borderBottom:
													i < requests.length - 1
														? "1px solid #f8fafc"
														: "none",
												transition: "background 0.15s",
											}}
											onMouseEnter={(e) =>
												(e.currentTarget.style.background = "#f8fafc")
											}
											onMouseLeave={(e) =>
												(e.currentTarget.style.background = "transparent")
											}>
											<td
												style={{
													padding: "13px 18px",
													fontSize: "12px",
													color: "#94a3b8",
													fontWeight: "500",
												}}>
												#{req.request_id}
											</td>
											<td style={{ padding: "13px 18px" }}>
												<div
													style={{
														fontSize: "13px",
														fontWeight: "600",
														color: "#0f172a",
													}}>
													{req.referrer_name}
												</div>
												<div
													style={{
														fontSize: "11px",
														color: "#94a3b8",
														marginTop: "2px",
													}}>
													{req.referrer_mobile}
												</div>
											</td>
											<td style={{ padding: "13px 18px" }}>
												<div
													style={{
														fontSize: "13px",
														fontWeight: "500",
														color: "#374151",
													}}>
													{req.plan_name}
												</div>
												<div
													style={{
														fontSize: "11px",
														color: "#94a3b8",
														marginTop: "2px",
													}}>
													{req.category_name}
												</div>
											</td>
											<td
												style={{
													padding: "13px 18px",
													fontSize: "13px",
													color: "#374151",
													whiteSpace: "nowrap",
												}}>
												{req.customer_name}
											</td>
											<td
												style={{
													padding: "13px 18px",
													fontSize: "12px",
													color: "#94a3b8",
													whiteSpace: "nowrap",
												}}>
												{new Date(req.created_at).toLocaleDateString("en-IN", {
													day: "2-digit",
													month: "short",
													year: "numeric",
												})}
											</td>
											<td style={{ padding: "13px 18px" }}>
												<StatusBadge status={req.status} />
											</td>
											<td style={{ padding: "13px 18px" }}>
												<PaymentBadge
													status={req.payment_status}
													requestStatus={req.status}
												/>
											</td>
											<td style={{ padding: "13px 18px", textAlign: "right" }}>
												<button
													onClick={() =>
														navigate(
															`/admin/referral-requests/${req.request_id}`,
														)
													}
													style={{
														display: "inline-flex",
														alignItems: "center",
														gap: "4px",
														padding: "6px 12px",
														background: "#f1f5f9",
														color: "#475569",
														border: "none",
														borderRadius: "7px",
														fontSize: "12px",
														fontWeight: "600",
														cursor: "pointer",
														transition: "all 0.15s",
													}}
													onMouseEnter={(e) => {
														e.currentTarget.style.background = "#0f172a";
														e.currentTarget.style.color = "white";
													}}
													onMouseLeave={(e) => {
														e.currentTarget.style.background = "#f1f5f9";
														e.currentTarget.style.color = "#475569";
													}}>
													Review <ChevronRight size={13} />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						{/* Pagination */}
						{totalPages > 1 && (
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "16px 20px",
									borderTop: "1px solid #f1f5f9",
								}}>
								<div style={{ fontSize: "12px", color: "#64748b" }}>
									Showing{" "}
									<span style={{ fontWeight: "600" }}>
										{(currentPage - 1) * pageSize + 1}
									</span>{" "}
									-{" "}
									<span style={{ fontWeight: "600" }}>
										{Math.min(currentPage * pageSize, total)}
									</span>{" "}
									of <span style={{ fontWeight: "600" }}>{total}</span> requests
								</div>
								<div
									style={{ display: "flex", gap: "8px", alignItems: "center" }}>
									<button
										disabled={currentPage === 1}
										onClick={() => setCurrentPage((p) => p - 1)}
										style={{
											padding: "6px 12px",
											background: currentPage === 1 ? "#f1f5f9" : "#fff",
											color: currentPage === 1 ? "#cbd5e1" : "#374151",
											border: "1px solid #e2e8f0",
											borderRadius: "6px",
											cursor: currentPage === 1 ? "not-allowed" : "pointer",
											display: "flex",
											alignItems: "center",
											fontSize: "12px",
											fontWeight: "600",
										}}
										onMouseEnter={(e) => {
											if (currentPage !== 1) {
												e.currentTarget.style.background = "#f1f5f9";
											}
										}}
										onMouseLeave={(e) => {
											if (currentPage !== 1) {
												e.currentTarget.style.background = "#fff";
											}
										}}>
										<ChevronLeft size={14} style={{ marginRight: "4px" }} />{" "}
										Previous
									</button>
									<span style={{ fontSize: "12px", color: "#64748b" }}>
										Page {currentPage} of {totalPages}
									</span>
									<button
										disabled={currentPage === totalPages}
										onClick={() => setCurrentPage((p) => p + 1)}
										style={{
											padding: "6px 12px",
											background:
												currentPage === totalPages ? "#f1f5f9" : "#fff",
											color: currentPage === totalPages ? "#cbd5e1" : "#374151",
											border: "1px solid #e2e8f0",
											borderRadius: "6px",
											cursor:
												currentPage === totalPages ? "not-allowed" : "pointer",
											display: "flex",
											alignItems: "center",
											fontSize: "12px",
											fontWeight: "600",
										}}
										onMouseEnter={(e) => {
											if (currentPage !== totalPages) {
												e.currentTarget.style.background = "#f1f5f9";
											}
										}}
										onMouseLeave={(e) => {
											if (currentPage !== totalPages) {
												e.currentTarget.style.background = "#fff";
											}
										}}>
										Next{" "}
										<ChevronRight size={14} style={{ marginLeft: "4px" }} />
									</button>
								</div>
							</div>
						)}
					</>
				)}
			</div>
			<style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
		</div>
	);
};

export default AdminRequests;
