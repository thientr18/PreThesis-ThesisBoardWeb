import React, { useState } from "react";
import ModeratorNavbar from "@/components/header/moderator/ModeratorNavbar";
import ModeratorSidebar from "@/components/sidebar/ModeratorSidebar";
import { AuthProvider } from "@/contexts/AuthContext";

export default function ModeratorLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Toggle sidebar function
    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    return (
        <AuthProvider>
            <div className="moderator-layout">
                <ModeratorNavbar toggleSidebar={toggleSidebar} />
                <div className="main-layout">
                    {isSidebarOpen && <ModeratorSidebar />}
                    <div className="main-content">
                        {children}
                    </div>
                </div>
            </div>
        </AuthProvider>
    );
}