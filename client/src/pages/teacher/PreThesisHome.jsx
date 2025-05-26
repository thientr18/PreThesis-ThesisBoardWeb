import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTeacher } from "@/contexts/TeacherContext";
import api from "@/utils/axios";

const PreThesisHome = () => {
    const { preThesisId } = useParams();
    const { teacher, semesters, loading } = useTeacher();
    const [preThesis, setPreThesis] = useState(null);
    const [topic, setTopic] = useState(null);
    const [student, setStudent] = useState(null);

    useEffect(() => {
        const fetchPreThesis = async () => {
            try {
                const response = await api.get(`/teacher/pre-thesis/${preThesisId}`);
                setPreThesis(response.data.preThesis);
                setTopic(response.data.preThesis.preThesisTopic);
                setStudent(response.data.preThesis.student);
                console.log(response.data);
            } catch (error) {
                console.error("Error fetching pre-thesis:", error);
            }
        };

        if (teacher) {
            fetchPreThesis();
        }
    }, [teacher]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!preThesis || !student) {
        return <div>No pre-thesis data found.</div>;
    }

    return (
        <div className="dashboard-container">
            <h1>Pre-Thesis Overview</h1>
            <div className="prethesis-info-stack">
                {/* Student Card */}
                <div className="prethesis-student-card">
                    <h2 className="prethesis-card-title">Student Info</h2>
                    <table className="prethesis-info-table">
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
                                <td className="value" style={{textTransform: "lowercase"}}>{student.email}</td>
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

                {/* Pre-Thesis Card */}
                <div className="prethesis-detail-card">
                    <h2 className="prethesis-card-title">Pre-Thesis Info</h2>
                    <table className="prethesis-info-table">
                        <tbody>
                            <tr>
                                <td className="label">Title:</td>
                                <td className="value">{preThesis.title}</td>
                            </tr>
                            <tr>
                                <td className="label">Topic:</td>
                                <td className="value">{topic?.topic}</td>
                            </tr>
                            <tr>
                                <td className="label">Description:</td>
                                <td className="value">{preThesis.description}</td>
                            </tr>
                            <tr>
                                <td className="label">Status:</td>
                                <td className="value">{preThesis.status}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default PreThesisHome;