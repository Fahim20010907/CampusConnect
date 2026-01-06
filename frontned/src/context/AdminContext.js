"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./Authcontext";

export const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [userRole, setUserRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/by-email/${user.email}`
        );
        const data = await response.json();

        if (data.success) {
          const role = data.data.role;
          setUserRole(role);
          setIsAdmin(role === "admin");
        }
      } catch (error) {
        console.error("Failed to fetch user role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return (
    <AdminContext.Provider value={{ isAdmin, userRole, loading }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
};
