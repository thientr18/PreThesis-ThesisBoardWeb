import React, { useState, useEffect } from "react";
import { useTeacher } from "@/contexts/TeacherContext";
import api from "@/utils/axios";

const TeacherTopic = () => {
    const { teacher, activeTeacher, loading } = useTeacher();
    const [topics, setTopics] = useState([]);
    const [activeSemester, setActiveSemester] = useState(null);
    const [remainingSlots, setRemainingSlots] = useState(0);
    const [fetchError, setFetchError] = useState(null);
    const [loadingTopics, setLoadingTopics] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(true);
    const [loadingSemesters, setLoadingSemesters] = useState(true);


    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState("add"); // "add" or "edit"
    const [formData, setFormData] = useState({
        topic: "",
        description: "",
        maximumSlots: 0,
        minGpa: 0
    });
    const [editTopicId, setEditTopicId] = useState(null);

    // Handle opening form
    const handleAddClick = () => {
        setFormData({
            topic: "",
            description: "",
            maximumSlots: 0,
            minGpa: 0
        });
        setShowForm(true);
        setFormMode("add");
    };

    const handleEditClick = (topic) => {
        setFormMode("edit");
        setEditTopicId(topic.id);
        setFormData({
            topic: topic.topic || "",
            description: topic.description || "",
            maximumSlots: topic.maximumSlots || 0,
            minGpa: topic.minGpa || 0
        });
        setShowForm(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.topic || !formData.description || !formData.maximumSlots || !formData.minGpa) {
            alert("Missing required fields");
            return;
        }

        try {
            if (formMode === "add") {
                await api.post("/teacher/topic", formData);
            } else if (formMode === "edit") {
                await api.put(`/teacher/topic/${editTopicId}`, formData);
            }
            setShowForm(false);
            setFormData({
                topic: "",
                description: "",
                maximumSlots: 0,
                minGpa: 0
            });
            const response = await api.get("/teacher/topic");
            setTopics(response.data.topics);
            setActiveSemester(response.data.semester);
            setRemainingSlots(response.data.teacher.remainingPreThesisSlots);
        } catch (error) {
            console.error("Error submitting form:", error);
            const response = await api.get("/teacher/topic");
            setTopics(response.data.topics);
            setActiveSemester(response.data.semester);
            setRemainingSlots(response.data.teacher.remainingPreThesisSlots);
            alert(error.response?.data?.message || "An error occurred while submitting the form");
        } finally {
            setLoadingTopics(false);
            setLoadingSlots(false);
            setLoadingSemesters(false);
        }
    };

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const response = await api.get("/teacher/topic");
                setTopics(response.data.topics);
                setActiveSemester(response.data.semester);
                setRemainingSlots(response.data.teacher.remainingPreThesisSlots);
            } catch (error) {
                if (error.response?.status === 404) {
                    console.warn(error.response.data.message);
                    console.log(error.response.data);
                    setTopics([]);
                    setActiveSemester(error.response.data.semester);
                    setRemainingSlots(error.response.data.teacher.remainingPreThesisSlots);
                    setFetchError(error.response.data.message);
                } else {
                    setFetchError("An error occurred while fetching topics");
                    console.error("Error fetching topics:", error);
                }
            } finally {
                setLoadingTopics(false);
                setLoadingSlots(false);
                setLoadingSemesters(false);
            }
        };

        fetchTopics();
    }, []);

    if (loading || loadingTopics || loadingSlots || loadingSemesters) {
        return <div className="topic">Loading...</div>;
    }

    return (
        <div className="topic-container">
            <h1>Available Topics</h1>
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-form">
                        <h2>{formMode === "add" ? "Add Topic" : "Edit Topic"}</h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Topic</td>
                                    <td>
                                        <input
                                            type="text"
                                            name="topic"
                                            value={formData.topic}
                                            onChange={handleChange}
                                            required
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Description</td>
                                    <td>
                                        <input
                                            type="text"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            required
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Maximum Slots</td>
                                    <td>
                                        <input
                                            type="number"
                                            name="maximumSlots"
                                            value={formData.maximumSlots}
                                            onChange={handleChange}
                                            required
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Minimum GPA</td>
                                    <td>
                                        <input
                                            type="number"
                                            name="minGpa"
                                            value={formData.minGpa}
                                            onChange={handleChange}
                                            required
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="modal-actions">
                            <button onClick={handleSubmit} className="btn btn-save">Save</button>
                            <button onClick={() => setShowForm(false)} className="btn btn-cancel">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="teacher-topic-header">
                <div className="left">
                    <div className="semester-box">
                        <span className="label">Active Semester:</span>
                        <span className="value">{activeSemester?.name || "N/A"}</span>
                    </div>
                    <div className="teacher-slot">
                        <span className="label">Remaining Slots:</span>
                        <span className="value">{remainingSlots}</span>
                    </div>
                </div>
                <div className="right">
                    <button onClick={handleAddClick} className="btn-add-student">
                        <img src="/plus-solid.svg" alt="Add new Button" />
                    </button>
                </div>
            </div>
            {loadingTopics ? (
                <p>Loading topics...</p>
            ) : fetchError ? (
                <p style={{ color: 'red' }}>{fetchError}</p>
            ) : topics.length === 0 ? (
                <p>No topics available.</p>
            ) : (
                <table className="students-table">
                    <thead>
                        <tr>
                            <th>Topic</th>
                            <th>Description</th>
                            <th>Maximum Slots</th>
                            <th>Remaining Slots</th>
                            <th>Min GPA</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topics.map((t) => (
                            <tr key={t.id}>
                                <td>{t.topic}</td>
                                <td>{t.description}</td>
                                <td>{t.maximumSlots}</td>
                                <td>{t.remainingSlots}</td>
                                <td>{t.minGpa}</td>
                                <td>{t.status === 'open' ? 'Open' : 'Closed'}</td>
                                <td>
                                    <button className="btn btn-primary" onClick={() => handleEditClick(t)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default TeacherTopic;