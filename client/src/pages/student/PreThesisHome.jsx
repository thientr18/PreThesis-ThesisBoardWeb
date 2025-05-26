import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useStudent } from "@/contexts/StudentContext";
import api from "@/utils/axios";

const PreThesisHome = () => {
    const { semesterId } = useParams();
    const { student, loading } = useStudent();
    const [preThesis, setPreThesis] = useState(null);
    const [topic, setTopic] = useState(null);
    const [teacher, setTeacher] = useState(null);

    useEffect(() => {
        const fetchPreThesis = async () => {
            try {
                const response = await api.get(`/student/pre-thesis/${semesterId}`);
                setPreThesis(response.data.preThesis);
                setTopic(response.data.preThesis.preThesisTopic);
                setTeacher(response.data.preThesis.preThesisTopic.supervisor);
            } catch (error) {
                console.error("Error fetching pre-thesis data:", error);
            }
        };

        fetchPreThesis();
    }, [semesterId]);

    if (loading) {
        return <div className="prethesis-home">Loading...</div>;
    }

    if (!preThesis) {
        return <div className="prethesis-home">No pre-thesis data available.</div>;
    }

    return (
        <div className="dashboard-container">
            <div className="prethesis-info-stack">
                <div className="prethesis-student-card">
                    <h2 className="prethesis-card-title">Teacher Info</h2>
                    <table className="prethesis-info-table">
                        <tbody>
                            <tr>
                                <td className="table-label">Full Name:</td>
                                <td className="table-value" style={{ color: "#2096f2" }}>{teacher.fullName}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Email:</td>
                                <td className="table-value" style={{ textTransform: "lowercase" }}>{teacher.email}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Phone:</td>
                                <td className="table-value">{teacher.phone}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="prethesis-detail-card">
                    <h2 className="prethesis-card-title">Pre-Thesis Details</h2>
                    <table className="prethesis-info-table">
                        <tbody>
                            <tr>
                                <td className="table-label">Title:</td>
                                <td className="table-value">{preThesis.title}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Description:</td>
                                <td className="table-value">{preThesis.description}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Status:</td>
                                <td className="table-value">{preThesis.status}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default PreThesisHome;