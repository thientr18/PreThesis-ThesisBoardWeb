import React, { useState } from "react";
import { useTeacher } from "@/contexts/TeacherContext";

export default function TeacherSidebar() {
    const { teacher, semesters, loading } = useTeacher();
    const [openSemester, setOpenSemester] = useState(null);

    if (loading) {
        return <div className="teacher-sidebar">Loading...</div>;
    }

    // Sort semesters by startDate, latest first
    const sortedSemesters = [...semesters].sort(
        (a, b) => new Date(b.startDate) - new Date(a.startDate)
    );

    return (
        <div className="teacher-sidebar">
            <div className="sidebar-content">
                {sortedSemesters && sortedSemesters.length > 0 ? (
                    sortedSemesters.map((sem, idx) => (
                        <div className="section" key={sem.id || idx}>
                            <div
                                className="section-title"
                                onClick={() => setOpenSemester(openSemester === idx ? null : idx)}
                                style={{ 
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                {sem.name}
                                <img
                                    src={openSemester === idx ? "/caret-up.svg" : "/caret-down.svg"}
                                    alt="caret"
                                    className="caret"
                                    style={{ marginLeft: 8}}
                                />
                            </div>
                            {openSemester === idx && (
                                <div className="section-content">
                                    <div className="sub-buttons">
                                        <a href={`/teacher/pre-thesis/topic`}>
                                            <button className="sidebar-btn">
                                                <span>Pre-Thesis Topic</span>
                                            </button>
                                        </a>
                                        <a href={`/teacher/pre-thesis/registration`}>
                                            <button className="sidebar-btn">
                                                <span>Pre-Thesis Registration</span>
                                            </button>
                                        </a>
                                        <a href={`/teacher/pre-thesis/student`}>
                                            <button className="sidebar-btn">
                                                <span>Pre-Thesis Student</span>
                                            </button>
                                        </a>
                                        <a href={`/teacher/thesis/assign-student`}>
                                            <button className="sidebar-btn">
                                                <span>Assign Thesis Student</span>
                                            </button>
                                        </a>
                                        <a href={`/teacher/thesis/student`}>
                                            <button className="sidebar-btn">
                                                <span>Thesis Student</span>
                                            </button>
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div>No semester data available.</div>
                )}
            </div>
        </div>
    );
}