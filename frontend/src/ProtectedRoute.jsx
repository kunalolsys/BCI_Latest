import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Protects routes from unauthenticated access.
 * Redirects to /login if not logged in.
 */
export default function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
