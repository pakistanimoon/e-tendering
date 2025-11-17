import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import OrganizationDashboard from './components/Organization/Dashboard';
import BidderDashboard from './components/Bidder/Dashboard';
import ProjectCreate from './components/Organization/ProjectCreate';
import ProjectDetail from './components/Organization/ProjectDetail';
import BidderProjectList from './components/Bidder/ProjectList';
import BidCreate from './components/Bidder/BidCreate';
import MyBids from './components/Bidder/MyBids';
import Evaluations from './components/Organization/Evaluations';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: 'organization' | 'bidder';
}> = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Organization Routes */}
      <Route
        path="/organization"
        element={
          <ProtectedRoute requiredRole="organization">
            <OrganizationDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organization/projects/new"
        element={
          <ProtectedRoute requiredRole="organization">
            <ProjectCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organization/projects/:id"
        element={
          <ProtectedRoute requiredRole="organization">
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organization/projects/:id/evaluations"
        element={
          <ProtectedRoute requiredRole="organization">
            <Evaluations />
          </ProtectedRoute>
        }
      />
      
      {/* Bidder Routes */}
      <Route
        path="/bidder"
        element={
          <ProtectedRoute requiredRole="bidder">
            <BidderDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bidder/projects"
        element={
          <ProtectedRoute requiredRole="bidder">
            <BidderProjectList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bidder/projects/:id/bid"
        element={
          <ProtectedRoute requiredRole="bidder">
            <BidCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bidder/my-bids"
        element={
          <ProtectedRoute requiredRole="bidder">
            <MyBids />
          </ProtectedRoute>
        }
      />
      
      {/* Default Route */}
      <Route
        path="/"
        element={
          user ? (
            user.role === 'organization' ? (
              <Navigate to="/organization" replace />
            ) : (
              <Navigate to="/bidder" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;