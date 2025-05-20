import React, { useState, useEffect } from "react";
import { useTeacher } from "@/contexts/TeacherContext";
import api from "@/utils/axios";

const ThesisStudent = () => {
    const { teacher, loading } = useTeacher();
    const [semester, setSemester] = useState(null);
    const [thesisStudents, setThesisStudents] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [deleteThesis, setDeleteThesis] = useState(false);

    const fetchThesisStudents = async () => {
        try {
            const response = await api.get('/teacher/thesis/assigned');
            console.log(response.data);
            setSemester(response.data.semester);
            setThesisStudents(response.data.thesisStudents);
        } catch (error) {
            console.error("Error fetching thesis students:", error);
        }
    };

    useEffect(() => {
        fetchThesisStudents();
    }, []);

    const handleEditThesis = async (studentId) => {
        try {
            const response = await api.post(`/teacher/thesis/assigned/${studentId}/update`, { title, description });
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

    const handleDeleteThesis = async (studentId) => {
        try {
            const response = await api.delete(`/teacher/thesis/assigned/${studentId}/delete`);
            fetchThesisStudents();
            setDeleteThesis(false);
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

            {thesisStudents.length > 0 && (
                <div className="assigned-students">
                    <h1>Your Thesis Students</h1>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Thesis</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {thesisStudents.map((s) => (
                                <tr key={s.id}>
                                    <td><a href={`/teacher/thesis/${s.id}`}>[{s.student.user.username}][{s.student.fullName}][{s.title}]</a></td>
                                    <td>
                                        <ul>
                                            <button onClick={() => {
                                                console.log(s);
                                            }}>View</button><span> | </span>
                                            <button onClick={() => {
                                                setOpenModal(true);
                                                setSelectedStudent(s.id);
                                                setTitle(s.title || "");
                                                setDescription(s.description || "");
                                            }}>Edit</button><span> | </span>
                                            <button onClick={() => {
                                                    setDeleteThesis(true);
                                                    handleDeleteThesis(s.id);
                                            }}>Remove</button>
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