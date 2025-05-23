import React, { useState, useEffect } from "react";
import { useStudent } from "@/contexts/StudentContext";
import api from "@/utils/axios";

const StudentDashboard = () => {
    const { student, loading } = useStudent();
    const activeStudent = student?.status === 'active';
    if (loading) {
        return <div className="student-dashboard">Loading...</div>;
    }

    return (
        <div className="student-dashboard">
            <h1>Welcome to the Student Dashboard</h1>
            {activeStudent ? (
                <p>Your account is active.</p>
            ) : (
                <p>Your account is inactive. Please contact support.</p>
            )}
        </div>
    );
}

export default StudentDashboard;