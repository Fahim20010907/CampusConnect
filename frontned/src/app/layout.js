// app/layout.jsx

import { AuthProvider } from "@/context/Authcontext";
import "./globals.css"
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>

          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}