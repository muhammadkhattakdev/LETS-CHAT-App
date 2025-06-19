import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../authContext/authContext";
import LoadingSpinner from "../loadingSpinner/loadingSpinner.jsx";

const ProtectedRoute = () => {
  const { user, loading, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!user) {
        await checkAuth();
      }
      setIsChecking(false);
    };

    verifyAuth();
  }, [user, checkAuth]);

  // Show loading spinner while checking authentication
  if (loading || isChecking) {
    return (
      <div className="protected-route-loading">
        <LoadingSpinner size="large" message="Verifying authentication..." />
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the protected component
  return <Outlet />;
};

export default ProtectedRoute;
