import React, { useState, useEffect } from "react";
import { useTeacher } from "@/contexts/TeacherContext";
import api from "@/utils/axios";

const TeacherDashboard = () => {
    const { teacher, isActiveTeacher, loading } = useTeacher();

    if (loading) {
        return <div className="teacher-dashboard">Loading...</div>;
    }

    return (
        <div className="teacher-dashboard">
            <h1>Welcome to the Teacher Dashboard</h1>
            {isActiveTeacher ? (
                <p>Your account is active.</p>
            ) : (
                <p>Your account is inactive. Please contact support.</p>
            )}
        </div>
    );
}

export default TeacherDashboard;