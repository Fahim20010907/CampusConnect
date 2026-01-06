// app/layout.jsx

import Navbar from "@/component/Navbar";
import { AuthProvider } from "@/context/Authcontext";
import { AdminProvider } from "@/context/AdminContext";
import "./globals.css"
export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-white">
      <body>
        <AuthProvider>
          <AdminProvider>
            <Navbar/>

            <main>{children}</main>
          </AdminProvider>
        </AuthProvider>
      </body>
    </html>
  );
}