import React, { useState, useEffect } from "react";
import { useTeacher } from "@/contexts/TeacherContext";
import api from "@/utils/axios";

const PreThesisStudent = () => {
    const { teacher, loading } = useTeacher();
    const [error, setError] = useState(null);
    const [loadingRegistrations, setLoadingRegistrations] = useState(true);
    const [registrations, setRegistrations] = useState([]);
    const [selectedRegistration, setSelectedRegistration] = useState(null);
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        const fetchRegistrations = async () => {
            try {
                const response = await api.get('/teacher/pre-thesis/registration');
                setRegistrations(response.data.registrations);
            } catch (err) {
                setRegistrations([]);
                setError(err.response?.data?.message || "An error occurred while fetching pre-thesis students.");
                console.error("Error fetching pre-thesis students:", err);
            } finally {
                setLoadingRegistrations(false);
            }
        };

        fetchRegistrations();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedRegistration(null);
    }

    const handleApprove = async () => {
        const confirmApprove = window.confirm("Verify to approve this registration?");
        if (!confirmApprove) {
            return;
        }
        try {
            await api.post(`/teacher/pre-thesis/registration/${selectedRegistration.id}/approve`);
            const response = await api.get('/teacher/pre-thesis/registration');
            setRegistrations(response.data.registrations);
            setOpenModal(false);
        } catch (err) {
            alert(`Error approving registration: ${err.response?.data?.message || "An error occurred."}`);
            console.error("Error approving registration:", err);
        }
    }
    const handleReject = async () => {
        const confirmReject = window.confirm("Verify to reject this registration?");
        if (!confirmReject) {
            return;
        }
        try {
            await api.post(`/teacher/pre-thesis/registration/${selectedRegistration.id}/reject`);
            setRegistrations(prev => prev.filter(r => r.id !== selectedRegistration.id));
            setOpenModal(false);
        } catch (err) {
            alert(`Error rejecting registration: ${err.response?.data?.message || "An error occurred."}`);
            console.error("Error rejecting registration:", err);
        }
    }

    return (
        <div>
            {loadingRegistrations && <p>Loading Pre-Thesis Registration...</p>}
            {error && <p>{error}</p>}
            {registrations.length === 0 && !loadingRegistrations && (
                <div>No Pre-Thesis Registrations</div>
            )}

            {registrations.length > 0 && (
                <div className="pre-thesis-students">
                    <h1>Pre-Thesis Registration</h1>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrations.map((r, index) => (
                                <tr 
                                    key={r.id || index}
                                    className="clickable-row"
                                    onClick={() => {
                                        setSelectedRegistration(r);
                                        setOpenModal(true);
                                    }}
                                >
                                    <td>{index + 1}</td>
                                    <td>{r.student.fullName}</td>
                                    <td>{r.student.email}</td>
                                    <td>{r.student.phone}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {openModal && (
                <div className="modal-overlay" onClick={() => { setOpenModal(false); setSelectedRegistration(null); }}>
                    <div className="modal-form" onClick={e => e.stopPropagation()}>
                        <h2>Student Details</h2>
                        <h3><strong>Student Info</strong></h3>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Name:</td>
                                    <td>{selectedRegistration?.student.fullName}</td>
                                </tr>
                                <tr>
                                    <td>Email:</td>
                                    <td>{selectedRegistration?.student.email}</td>
                                </tr>
                                <tr>
                                    <td>Phone:</td>
                                    <td>{selectedRegistration?.student.phone}</td>
                                </tr>
                                <tr>
                                    <td>GPA:</td>
                                    <td>{selectedRegistration?.student.gpa}</td>
                                </tr>
                                <tr>
                                    <td>Credits:</td>
                                    <td>{selectedRegistration?.student.credits}</td>
                                </tr>
                            </tbody>
                        </table>
                        <h3><strong>Topic Info</strong></h3>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Title:</td>
                                    <td>{selectedRegistration?.title}</td>
                                </tr>
                                <tr>
                                    <td>Description:</td>
                                    <td>{selectedRegistration?.description}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="modal-actions">
                            <button className="btn btn-save" onClick={() => handleApprove()}>Approve</button>
                            <button className="btn btn-reject" onClick={() => handleReject()}>Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PreThesisStudent;