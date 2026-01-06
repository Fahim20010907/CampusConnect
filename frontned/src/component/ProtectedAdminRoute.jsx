"use client";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/Authcontext";
import { useAdmin } from "@/context/AdminContext";

/**
 * ProtectedAdminRoute: Wrapper to ensure only admins can access the page
 */
export default function ProtectedAdminRoute({ children }) {
  const router = useRouter();
  const { user, loading: authLoading } = useContext(AuthContext);
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading || adminLoading) return;

    if (!user) {
      // Redirect to login if not authenticated
      router.push("/login");
      return;
    }

    if (!isAdmin) {
      // Redirect to home if not admin
      router.push("/");
      return;
    }

    setIsAuthorized(true);
  }, [user, authLoading, adminLoading, isAdmin, router]);

  if (authLoading || adminLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
