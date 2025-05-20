import React, { useState, useEffect } from "react";
import { useTeacher } from "@/contexts/TeacherContext";
import api from "@/utils/axios";

const AssignThesis = () => {
    const { teacher, loading } = useTeacher();
    const [semester, setSemester] = useState(null);
    const [notRegisteredStudents, setNotRegisteredStudents] = useState([]);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");

    const fetchThesisStudents = async () => {
        try {
            const response = await api.get('/teacher/thesis/assigned');
            setSemester(response.data.semester);
            setAssignedStudents(response.data.thesisStudents);
            setNotRegisteredStudents(response.data.notRegisteredStudents);
        } catch (error) {
            console.error("Error fetching thesis students:", error);
        }
    };
    useEffect(() => {
        fetchThesisStudents();
    }, []);

    const handleAssignThesis = async (studentId) => {
        try {
            const response = await api.post(`/teacher/thesis/assigned/${studentId}/new`, {title, description});
            fetchThesisStudents();
            setOpenModal(false);
            setSelectedStudent(null);
            setTitle("");
            setDescription("");
        } catch (error) {
            alert(`Error assigning thesis: ${error.response?.data?.message || "An error occurred"}`);
            console.error("Error assigning thesis:", error);
        }
    }

    if (loading) {
        return <div>Loading...</div>;
    }
    
    return (
        <div className="thesis-student">

            {semester && (
                <div className="semester-info">
                    <h1>Semester: {semester.name}</h1>
                </div>
            )}

            {assignedStudents.length > 0 && (
                <div className="assigned-students">
                    <h1>Your Thesis Students</h1>
                    <table className="table">
                        <tbody>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                            </tr>
                            {assignedStudents.map((s) => (
                                <tr key={s.id}>
                                    <td>{s.student.user.username}</td>
                                    <td>{s.student.fullName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {notRegisteredStudents.length > 0 && (
            <div className="not-registered-students">
                <h1 style={{ marginTop: "40px" }}>Not Registered Students</h1>
                <table className="table">
                    <tbody>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>GPA</th>
                            <th>Credits</th>
                            <th>Email</th>
                            <th>Phone</th>
                        </tr>
                    {notRegisteredStudents.map((s) => (
                        <tr key={s.student.user.username}
                            className="clickable-row"
                            onClick={() => {
                                setSelectedStudent(s);
                                setOpenModal(true);
                            }}
                        >
                            <td>{s.student.user.username}</td>
                            <td>{s.student.fullName}</td>
                            <td>{s.student.gpa}</td>
                            <td>{s.student.credits}</td>
                            <td>{s.student.email}</td>
                            <td>{s.student.phone}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            )}

            {openModal && (
                <div className="modal-overlay" onClick={() => { setOpenModal(false); setSelectedStudent(null); }}>
                    <div className="modal-form" onClick={(e) => e.stopPropagation()}>
                        <h2>Assign Thesis to {selectedStudent?.student.fullName}</h2>
                        <h3><strong>Thesis Information</strong></h3>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Thesis Title:</td>
                                    <td><textarea
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            rows={2}
                                            placeholder="Enter thesis title"
                                        /></td>
                                </tr>
                                <tr>
                                    <td>Thesis Description:</td>
                                    <td>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            placeholder="Enter thesis description"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="modal-actions">
                            <button className="btn btn-save" onClick={() => handleAssignThesis(selectedStudent?.student.id)}>Assign Thesis</button>
                            <button className="btn btn-cancel" onClick={() => { setOpenModal(false); setSelectedStudent(null); }}>Cancel</button>
                        </div>
                        <h3><strong>Student Information</strong></h3>
                        <table>
                            <tbody>
                                <tr>
                                    <td>ID:</td>
                                    <td>{selectedStudent?.student.user.username}</td>
                                </tr>
                                <tr>
                                    <td>Name:</td>
                                    <td>{selectedStudent?.student.fullName}</td>
                                </tr>
                                <tr>
                                    <td>GPA:</td>
                                    <td>{selectedStudent?.student.gpa}</td>
                                </tr>
                                <tr>
                                    <td>Credits:</td>
                                    <td>{selectedStudent?.student.credits}</td>
                                </tr>
                                <tr>
                                    <td>Email:</td>
                                    <td>{selectedStudent?.student.email}</td>
                                </tr>
                                <tr>
                                    <td>Phone:</td>
                                    <td>{selectedStudent?.student.phone}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AssignThesis;