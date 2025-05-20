import React, { useEffect, useState } from "react";
import StudentNavbar from "@/components/header/student/StudentNavbar";
import StudentSidebar from "@/components/sidebar/StudentSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { StudentProvider } from "../contexts/StudentContext";

export default function StudentLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };
    
    return (
        <AuthProvider>
            <StudentProvider>
                <div className="student-layout">
                    <StudentNavbar toggleSidebar={toggleSidebar} />
                    <div className="main-layout">
                        {isSidebarOpen && <StudentSidebar />}
                        <div className="main-content">
                            {children}
                        </div>
                    </div>
                </div>
            </StudentProvider>
        </AuthProvider>
    );
}