import React, { useState, useEffect } from "react";
import { useTeacher } from "@/contexts/TeacherContext";

export default function TeacherSidebar() {
    const { teacher, loading } = useTeacher();
    const [preThesisOpen, setPreThesisOpen] = useState(false);
    const [thesisOpen, setThesisOpen] = useState(false);
    const togglePreThesis = () => setPreThesisOpen((prev) => !prev);
    const toggleThesis = () => setThesisOpen((prev) => !prev);

    const isActiveTeacher = teacher?.status === "active";
    
    if (loading) {
        return <div className="teacher-sidebar">Loading...</div>;
    }

    return (
    <div className="teacher-sidebar">
        <div className="sidebar-content">
            <div className="section">
                <div className="section-title">Applications</div>
                <div className="section-content">
                    <button className="sidebar-btn" onClick={togglePreThesis}>
                        <img src="/student-icon.svg" alt="student icon" className="icon" />
                        <span>Pre-Thesis</span>
                        <img
                            src={preThesisOpen ? "/caret-up.svg" : "/caret-down.svg"}
                            alt="caret"
                            className="caret"
                        />
                    </button>
                    {preThesisOpen && (
                        <div className="sub-buttons">
                            {isActiveTeacher && (
                                <a href="/teacher/pre-thesis/topic">
                                    <button className="sidebar-btn">
                                        <span>Topic</span>
                                    </button>
                                </a>
                            )}
                            {isActiveTeacher && (
                                <a href="/teacher/pre-thesis/registration">
                                    <button className="sidebar-btn">
                                        <span>Registration</span>
                                    </button>
                                </a>
                            )}
                            <a href="/teacher/pre-thesis/student">
                                <button className="sidebar-btn">
                                    <span>Student</span>
                                </button>
                            </a>
                        </div>
                    )}
                    <button className="sidebar-btn" onClick={toggleThesis}>
                        <img src="/student-icon.svg" alt="student icon" className="icon" />
                        <span>Thesis</span>
                        <img
                            src={thesisOpen ? "/caret-up.svg" : "/caret-down.svg"}
                            alt="caret"
                            className="caret"
                        />
                    </button>
                    {thesisOpen && (
                        <div className="sub-buttons">
                            {isActiveTeacher && (
                                <a href="/teacher/thesis/assign-student">
                                    <button className="sidebar-btn">
                                        <span>Assign Student</span>
                                    </button>
                                </a>
                            )}
                            <a href="/teacher/thesis/student">
                                <button className="sidebar-btn">
                                    <span>Student</span>
                                </button>
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}