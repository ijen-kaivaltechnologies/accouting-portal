import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import LoginPage from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import UserDetails from "./pages/UserDetails";
import FolderView from "./pages/FolderView";
import FolderViewShared from "./pages/FolderViewShared";
import UserList from "./pages/UserList";
import ReferrerLogin from "./pages/ReferrerLogin";
import ReferrerSignUp from "./pages/ReferrerSignUp";
import ReferrerDashboard from "./pages/ReferrerDashboard";
import ReferrerPlans from "./pages/ReferrerPlans";
import ReferrerSubmit from "./pages/ReferrerSubmit";
import ReferrerRecord from "./pages/ReferrerRecord";
import ReferrerMoney from "./pages/ReferrerMoney";
import ReferrerProfile from "./pages/ReferrerProfile";
import ReferrerRemark from "./pages/ReferrerRemark";
import AdminReferrers from "./pages/AdminReferrers";
import AdminReferrerDetail from "./pages/AdminReferrerDetail";
import AdminRequests from "./pages/AdminRequests";
import AdminRequestDetail from "./pages/AdminRequestDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AdminLayout from "./components/AdminLayout";

import "./index.css"

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route path="/shared/folder/:code" element={<FolderViewShared />} />
      
      {/* Referrer Routes */}
      <Route path="/" element={<PublicRoute><ReferrerLogin /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><ReferrerSignUp /></PublicRoute>} />
      <Route path="/dashboard" element={<ReferrerDashboard />}>
        <Route index element={<Navigate to="plans" replace />} />
        <Route path="plans" element={<ReferrerPlans />} />
        <Route path="plans/:planId/submit" element={<ReferrerSubmit />} />
        <Route path="record" element={<ReferrerRecord />} />
        <Route path="money" element={<ReferrerMoney />} />
        <Route path="profile" element={<ReferrerProfile />} />
        <Route path="remark" element={<ReferrerRemark />} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      
      <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<UserList />} />
        <Route path="user/:userId" element={<UserDetails />} />
        <Route path="user/:userId/folder/:folderId" element={<FolderView />} />
        
        {/* Admin Referrer Management Routes */}
        <Route path="referrers" element={<AdminReferrers />} />
        <Route path="referrers/:id" element={<AdminReferrerDetail />} />
        <Route path="referral-requests" element={<AdminRequests />} />
        <Route path="referral-requests/:requestId" element={<AdminRequestDetail />} />
      </Route>
      
      {/* Redirect to home if path not found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);