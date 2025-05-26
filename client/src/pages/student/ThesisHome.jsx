import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useStudent } from "@/contexts/StudentContext";
import api from "@/utils/axios";

const ThesisHome = () => {
    const { semesterId } = useParams();
    const { student, loading } = useStudent();
    const [thesis, setThesis] = useState(null);
    const [teacher, setTeacher] = useState(null);

    useEffect(() => {
        const fetchThesis = async () => {
            try {
                const response = await api.get(`/student/thesis/${semesterId}`);
                setThesis(response.data.thesis);
                setTeacher(response.data.thesis.supervisor);
            } catch (error) {
                console.error("Error fetching thesis data:", error);
            }
        };

        fetchThesis();
    }, [semesterId]);

    if (loading) {
        return <div className="thesis-home">Loading...</div>;
    }
    if (!thesis) {
        return <div className="thesis-home">No thesis data available.</div>;
    }

    return (
        <div className="dashboard-container">
            <h1>Thesis Overview</h1>
            <div className="thesis-info-stack">
                <div className="thesis-student-card">
                    <h2 className="thesis-card-title">Teacher Info</h2>
                    <table className="thesis-info-table">
                        <tbody>
                            <tr>
                                <td className="table-label">Full Name:</td>
                                <td className="table-value" style={{color: "#2096f2"}}>{teacher.fullName}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Email:</td>
                                <td className="table-value" style={{textTransform: "lowercase"}}>{teacher.email}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Phone:</td>
                                <td className="table-value">{teacher.phone}</td>
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
                                <td className="label">Description:</td>
                                <td className="value">
                                    <div>{thesis.description}</div>
                                </td>
                            </tr>
                            <tr>
                                <td className="label">Status:</td>
                                <td className="value">
                                    <span className={`thesis-status-badge ${thesis.status}`}>
                                        {thesis.status}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default ThesisHome;