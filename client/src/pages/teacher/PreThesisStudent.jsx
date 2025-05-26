import React, { useState, useEffect } from "react";
import { useTeacher } from "@/contexts/TeacherContext";
import api from "@/utils/axios";

const PreThesisStudent = () => {
    const { teacher, semesters, loading } = useTeacher();
    const [semester, setSemester] = useState(null);
    const [preThesisStudents, setPreThesisStudents] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [deleteThesis, setDeleteThesis] = useState(false);

    const fetchPreThesisStudents = async () => {
        try {
            const response = await api.get('/teacher/pre-thesis/assigned');
            console.log(response.data);
            setSemester(response.data.semester);
            setPreThesisStudents(response.data.preThesisStudents);
        } catch (error) {
            alert(`Error fetching pre-thesis students: ${error.response?.data?.message || "An error occurred"}`);
            console.error("Error fetching pre-thesis students:", error);
        }
    };

    useEffect(() => {
        fetchPreThesisStudents();
    }, []);

    const handleDeletePreThesis = async (preThesisId) => {
        try {
            const response = await api.delete(`/teacher/pre-thesis/assigned/${preThesisId}/delete`);
            fetchPreThesisStudents();
            setDeleteThesis(false);
            setSelectedStudent(null);
            setTitle("");
            setDescription("");
        } catch (error) {
            alert(`Error deleting pre-thesis: ${error.response?.data?.message || "An error occurred"}`);
            console.error("Error deleting pre-thesis:", error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="prethesis-student">
            {semester && (
                <div className="semester-info">
                    <h1>Semester: {semester.name}</h1>
                </div>
            )}

            {preThesisStudents.length > 0 ? (
                <div className="assigned-prethesis-students">
                    <h1>Your Pre-Thesis Students</h1>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Pre-Thesis</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {preThesisStudents.map((s) => (
                                <tr key={s.id}>
                                    <td><a href={`/teacher/pre-thesis/${s.id}`}>[{s.student.user.username}][{s.student.fullName}][{s.preThesisTopic.topic}]</a></td>
                                    <td>
                                        <button onClick={() => {
                                                handleDeletePreThesis(s.id);
                                        }}>Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div>No pre-thesis students assigned.</div>
            )}
        </div>
    );
}

export default PreThesisStudent;