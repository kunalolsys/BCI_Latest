import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useSessionTimeout } from "./contexts/SessionTimeoutContext";
import axios from "axios";


export default function ProtectedLayout() {
  const { setSessionTimeout } = useSessionTimeout();
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (
      location.pathname === "/login" ||
      location.pathname === "/reset-password"
    ) {
      return;
    }
    axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/setup/employees/currentDetails`, { withCredentials: true })
      .then((res) => {
        setUser(res.data.employee || null);
      })
      .catch((err) => {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setSessionTimeout(true);
        }
      });
  }, [setSessionTimeout, location.pathname]);

  return (
    <Sidebar user={user}>
      <Outlet />
    </Sidebar>
  );
} 