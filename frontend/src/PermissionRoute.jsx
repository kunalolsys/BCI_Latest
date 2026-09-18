import React from "react";
import { Navigate } from "react-router-dom";

export default function PermissionRoute({ children, required }) {
  const permissions = JSON.parse(localStorage.getItem("permissions") || "[]");
  if (!permissions.includes(required)) {
    return <Navigate to="/" replace />;
  }
  return children;
} 