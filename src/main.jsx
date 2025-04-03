import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";

import LoginPage from "./pages/Login";
import SignUpPage from "./pages/SignUp";
import UserDetails from "./pages/UserDetails";
import FolderView from "./pages/FolderView";
import FolderViewShared from "./pages/FolderViewShared";
import UserList from "./pages/UserList";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";


import "./index.css"

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
      <Route path="/shared/folder/:code" element={<FolderViewShared />} />
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
      <Route path="/user/:userId" element={<ProtectedRoute><UserDetails /></ProtectedRoute>} />
      <Route path="/user/:userId/folder/:folderId" element={<ProtectedRoute><FolderView /></ProtectedRoute>} />
      
      {/* Redirect to login if trying to access protected routes without authentication */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </BrowserRouter>
);