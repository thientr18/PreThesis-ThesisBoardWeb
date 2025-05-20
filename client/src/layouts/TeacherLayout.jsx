import React, { useEffect, useState } from "react";
import TeacherNavbar from "@/components/header/teacher/TeacherNavbar";
import TeacherSidebar from "@/components/sidebar/TeacherSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { TeacherProvider } from "../contexts/TeacherContext";

export default function TeacherLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <AuthProvider>
      <TeacherProvider>
        <div className="teacher-layout">
          <TeacherNavbar toggleSidebar={toggleSidebar} />
          <div className="main-layout">
            {isSidebarOpen && <TeacherSidebar />}
            <div className="main-content">
              {children}
            </div>
          </div>
        </div>
      </TeacherProvider>
    </AuthProvider>
  );
}