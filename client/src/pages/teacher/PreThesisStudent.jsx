import React, { useState, useEffect } from "react";
import { useTeacher } from "@/contexts/TeacherContext";
import api from "@/utils/axios";

const PreThesisStudent = () => {
    const { teacher, loading } = useTeacher();
    const [semester, setSemester] = useState(null);
    const [preThesisStudents, setPreThesisStudents] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [deletePreThesis, setDeletePreThesis] = useState(false);

    const fetchPreThesisStudents = async () => {
        try {
            const response = await api.get('/teacher/pre-thesis/assigned');
            console.log(response.data);
            setSemester(response.data.semester);
            setPreThesisStudents(response.data.preThesisStudents);
        } catch (error) {
            console.error("Error fetching pre-thesis students:", error);
        }
    };

    useEffect(() => {
        fetchPreThesisStudents();
    }, []);


    const handleEditPreThesis = async (studentId) => {
        try {
            const response = await api.post(`/teacher/pre-thesis/assigned/${studentId}/update`, { title, description });
            fetchPreThesisStudents();
            setOpenModal(false);
            setSelectedStudent(null);
            setTitle("");
            setDescription("");
        } catch (error) {
            alert(`Error assigning pre-thesis: ${error.response?.data?.message || "An error occurred"}`);
            console.error("Error assigning pre-thesis:", error);
        }
    }

    const handleDeletePreThesis = async (studentId) => {
        try {
            const response = await api.delete(`/teacher/pre-thesis/assigned/${studentId}/delete`);
            fetchPreThesisStudents();
            setDeletePreThesis(false);
            setSelectedStudent(null);
            setTitle("");
            setDescription("");
        } catch (error) {
            alert(`Error deleting pre-thesis: ${error.response?.data?.message || "An error occurred"}`);
            console.error("Error deleting pre-thesis:", error);
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

            {preThesisStudents.length > 0 && (
                <div className="assigned-students">
                    <h1>Your Pre-Thesis Students</h1>
                    <table className="table">
                        <tbody>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                            {preThesisStudents.map((student) => (
                                <tr key={student.id}>
                                    <td>{student.id}</td>
                                    <td>{student.name}</td>
                                    <td>{student.title}</td>
                                    <td>{student.description}</td>
                                    <td>
                                        {/* Add your action buttons here */}
                                        {/* Example: Edit and Delete buttons */}
                                        <button onClick={() => handleEditPreThesis(student.id)}>Edit</button>
                                        <button onClick={() => handleDeletePreThesis(student.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default PreThesisStudent;