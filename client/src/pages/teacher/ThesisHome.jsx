import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTeacher } from "@/contexts/TeacherContext";
import api from "@/utils/axios";

const ThesisHome = () => {
    const { thesisId } = useParams();
    const { teacher, semesters, loading } = useTeacher();
    const [thesis, setThesis] = useState(null);
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const fetchThesis = async () => {
            try {
                const response = await api.get(`/teacher/thesis/${thesisId}`);
                setThesis(response.data.thesis);
                setStudent(response.data.thesis.student);
                console.log(response.data);
            } catch (error) {
                console.error("Error fetching thesis:", error);
            }
        };

        if (teacher) {
            fetchThesis();
        }
    }, [teacher]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!thesis || !student) {
        return <div>No thesis data found.</div>;
    }

    return (
        <div className="dashboard-container">
            <h1>Thesis Overview</h1>
            <div className="thesis-info-stack">
                {/* Student Card */}
                <div className="thesis-student-card">
                    <h2 className="thesis-card-title">Student Info</h2>
                    <table className="thesis-info-table">
                        <tbody>
                            <tr>
                                <td className="label">Full Name:</td>
                                <td className="value student-name" style={{color: "#2096f2"}}>{student.fullName}</td>
                            </tr>
                            <tr>
                                <td className="label">Student ID:</td>
                                <td className="value">{student.user?.username}</td>
                            </tr>
                            <tr>
                                <td className="label">Email:</td>
                                <td className="value">{student.email}</td>
                            </tr>
                            <tr>
                                <td className="label">Phone:</td>
                                <td className="value">{student.phone}</td>
                            </tr>
                            <tr>
                                <td className="label">GPA:</td>
                                <td className="value">{student.gpa}</td>
                            </tr>
                            <tr>
                                <td className="label">Credits:</td>
                                <td className="value">{student.credits}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Thesis Card */}
                <div className="thesis-detail-card">
                    <h2 className="thesis-card-title">Thesis Details</h2>
                    <table className="thesis-info-table">
                        <tbody>
                            <tr>
                                <td className="label">Title:</td>
                                <td className="value thesis-title" style={{fontWeight: 700, color: "#002f65"}}>{thesis.title}</td>
                            </tr>
                            <tr>
                                <td className="label">Status:</td>
                                <td className="value">
                                    <span className={`thesis-status-badge ${thesis.status}`}>
                                        {thesis.status}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td className="label">Description:</td>
                                <td className="value">
                                    <div>{thesis.description}</div>
                                </td>
                            </tr>
                            <tr>
                                <td className="label">Created:</td>
                                <td className="value">{new Date(thesis.createdAt).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <h1>Notifications</h1>
        </div>
    );
};

export default ThesisHome;
