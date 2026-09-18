import React, { createContext, useContext, useState } from "react";

const SessionTimeoutContext = createContext();

export function SessionTimeoutProvider({ children }) {
  const [sessionTimeout, setSessionTimeout] = useState(false);
  return (
    <SessionTimeoutContext.Provider value={{ sessionTimeout, setSessionTimeout }}>
      {children}
    </SessionTimeoutContext.Provider>
  );
}

export function useSessionTimeout() {
  return useContext(SessionTimeoutContext);
} 