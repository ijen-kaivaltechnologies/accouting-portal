import React from 'react';
import { Navigate } from 'react-router';

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const referrerToken = localStorage.getItem('referrer_token');
  
  if (token) {
    return <Navigate to="/admin" replace />;
  }

  if (referrerToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;