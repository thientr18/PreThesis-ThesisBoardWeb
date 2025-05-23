import React, { useState } from "react";
import AdminNavbar from "@/components/header/admin/AdminNavbar";
import AdminSidebar from "@/components/sidebar/AdminSidebar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <AuthProvider>
      <div className="admin-layout">
        <AdminNavbar toggleSidebar={toggleSidebar} />
        <div className="main-layout">
          {isSidebarOpen && <AdminSidebar />}
          <div className="main-content">
            {children}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
