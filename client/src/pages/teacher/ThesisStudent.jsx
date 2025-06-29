import React, { useState, useEffect } from "react";
import { useTeacher } from "@/contexts/TeacherContext";
import api from "@/utils/axios";

const ThesisStudent = () => {
    const { teacher, loading } = useTeacher();
    const [semester, setSemester] = useState(null);
    const [thesisStudents, setThesisStudents] = useState([]);
    const [supervisedStudents, setSupervisedStudents] = useState([]);
    const [reviewedStudents, setReviewedStudents] = useState([]);
    const [committeeStudents, setCommitteeStudents] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");

    const fetchThesisStudents = async () => {
        try {
            const response = await api.get('/teacher/thesis/belonging');
            console.log(response.data);
            setSemester(response.data.semester);
            
            const students = response.data.thesisStudents || [];
            setThesisStudents(students);
            
            // Classify students based on teacher role
            const supervised = students.filter(ts => 
                ts.thesisTeachers?.some(tt => tt.role === 'supervisor')
            );
            const reviewed = students.filter(ts =>
                ts.thesisTeachers?.some(tt => tt.role === 'reviewer')
            );
            const committee = students.filter(ts => 
                ts.thesisTeachers?.some(tt => tt.role === 'committee')
            );
            
            setSupervisedStudents(supervised);
            setReviewedStudents(reviewed);
            setCommitteeStudents(committee);
        } catch (error) {
            console.error("Error fetching thesis students:", error);
        }
    };

    useEffect(() => {
        fetchThesisStudents();
    }, []);

    const handleEditThesis = async (studentId) => {
        try {
            await api.post(`/teacher/thesis/assigned/${studentId}/update`, { title, description });
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

    const handleDeleteThesis = async (thesisId) => {
        try {
            await api.delete(`/teacher/thesis/assigned/${thesisId}/delete`);
            fetchThesisStudents();
            setSelectedStudent(null);
            setTitle("");
            setDescription("");
        } catch (error) {
            alert(`Error deleting thesis: ${error.response?.data?.message || "An error occurred"}`);
            console.error("Error deleting thesis:", error);
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

            {supervisedStudents.length > 0 && (
                <div className="assigned-students">
                    <h1>Your Supervised Students</h1>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Thesis</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supervisedStudents.map((ts) => (
                                <tr key={ts.id}>
                                    <td><a href={`/teacher/thesis/${ts.id}`}>[{ts.student.user.username}][{ts.student.fullName}][{ts.title}]</a></td>
                                    <td>
                                        <ul>
                                            <button onClick={() => {
                                                setOpenModal(true);
                                                setSelectedStudent(ts.id);
                                                setTitle(ts.title || "");
                                                setDescription(ts.description || "");
                                            }}>Edit</button><span> | </span>
                                            <button onClick={() => {
                                                    handleDeleteThesis(ts.id);
                                            }}>Remove</button>
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table> <br />
                </div>
            )}

            {reviewedStudents.length > 0 && (
                <div className="assigned-students">
                    <h1>Reviewer for These Students</h1>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Thesis</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviewedStudents.map((ts) => (
                                <tr key={ts.id}>
                                    <td><a href={`/teacher/thesis/${ts.id}`}>[{ts.student.user.username}][{ts.student.fullName}][{ts.title}]</a></td>
                                    <td>
                                        <ul>
                                            <span>View Only</span>
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <br />
            {committeeStudents.length > 0 && (
                <div className="assigned-students">
                    <h1>Committee Member for These Students</h1>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Thesis</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {committeeStudents.map((ts) => (
                                <tr key={ts.id}>
                                    <td><a href={`/teacher/thesis/${ts.id}`}>[{ts.student.user.username}][{ts.student.fullName}][{ts.title}]</a></td>
                                    <td>
                                        <ul>
                                            <span>View Only</span>
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {thesisStudents.length === 0 && (
                <div className="no-students">
                    <h1>No thesis students assigned yet.</h1>
                </div>
            )}

            {openModal && (
                <div className="modal-overlay">
                    <div className="modal-form">
                        <h2>Edit Thesis</h2>
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <textarea
                            placeholder="Description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        ></textarea>
                        <div className="modal-actions">
                            <button className="btn btn-save" onClick={() => handleEditThesis(selectedStudent)}>Save</button>
                            <button className="btn btn-cancel" onClick={() => setOpenModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ThesisStudent;