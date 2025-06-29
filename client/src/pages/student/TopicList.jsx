import React, { useState, useEffect } from "react";
import { useStudent } from "@/contexts/StudentContext";
import api from "@/utils/axios";

export default function TopicList() {
    const { student, loading } = useStudent();
    const [semester, setSemester] = useState(null);
    const [topics, setTopics] = useState([]);
    const [topicLoading, setTopicLoading] = useState(true);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [approvedTopic, setApprovedTopic] = useState(null);
    const [appliedTopics, setAppliedTopics] = useState([]);
    const [topic, setTopic] = useState(null);
    const [error, setError] = useState("");
    const [isStudentActive, setIsStudentActive] = useState(true);
    
    useEffect(() => {
        fetchApplied();
        fetchTopics();
    }, []);
    
    const fetchApplied = async () => {
        try {
            const response = await api.get(`/student/applied-topic`);
            if (response.data.appliedTopics) {
                setAppliedTopics(response.data.appliedTopics);
            }
            if (response.data.approvedTopic) {
                setApprovedTopic(response.data.approvedTopic.approvedTopic);
                setTopic(response.data.approvedTopic.topic);
            }
            setIsStudentActive(true);
            setError("");
        } catch (error) {
            if (error.response && error.response.status === 404) {
                const errorMessage = error.response?.data?.error || error.response?.data?.message;
                if (errorMessage && errorMessage.toLowerCase().includes('student not active')) {
                    setIsStudentActive(false);
                    setError("Student not active. Please contact administration to activate your account.");
                } else {
                    setAppliedTopics([]);
                    setApprovedTopic(null);
                }
            } else {
                console.error("Error fetching applied topic:", error);
                setError("Failed to load applied topics");
            }
        } finally {
            setTopicLoading(false);
        }
    }

    const fetchTopics = async () => {
        try {
            const response = await api.get('/student/topic-list');
            setTopics(response.data.topics);
            setSemester(response.data.semester);
            setIsStudentActive(true);
            setError("");
        } catch (error) {
            if (error.response && error.response.status === 404) {
                const errorMessage = error.response?.data?.error || error.response?.data?.message;
                if (errorMessage && errorMessage.toLowerCase().includes('student not active')) {
                    setIsStudentActive(false);
                    setError("Student not active. Please contact administration to activate your account.");
                } else {
                    setError("No topics available or semester not found");
                }
            } else {
                console.error("Error fetching topics:", error);
                setError("Failed to load topics");
            }
        } finally {
            setTopicLoading(false);
        }
    };
    
    if (loading) {
        return <div>Loading...</div>;
    }

    // Show student not active message
    if (!isStudentActive) {
        return (
            <div className="topic-container">
                <div className="error-message" style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    margin: '20px 0'
                }}>
                    <h2>Account Status: Inactive</h2>
                    <p>{error}</p>
                    <p>You cannot access topics or apply for thesis topics while your account is inactive.</p>
                </div>
            </div>
        );
    }

    // Show other errors
    if (error && isStudentActive) {
        return (
            <div className="topic-container">
                <div className="error-message" style={{
                    backgroundColor: '#fef3cd',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    padding: '16px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    margin: '20px 0'
                }}>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const handleSubmit = async (topic) => {
        // Validate title length
        if (!title.trim()) {
            alert("Pre-thesis title is required.");
            return;
        }
        
        if (title.length > 255) {
            alert("Pre-thesis title must be 255 characters or less.");
            return;
        }
        
        if (!description.trim()) {
            alert("Ideas/description is required.");
            return;
        }
        try {
            await api.post(`/student/apply-topic/${topic.id}`, { title, description });
            alert("Successfully applied for the topic!");
            const response = await api.get(`/student/applied-topic`);
            await fetchApplied();
            setOpenModal(false);
        } catch (error) {
            alert("Failed to apply for the topic.\n" + error.response.data.message);
            console.error("Error applying for topic:", error);
        } 
    }

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedTopic(null);
        setDescription("");
    }

    const handleCancelTopic = async (application) => {
        const confirm = window.confirm("Are you sure you want to cancel your application for this topic?");
        if (!confirm) return;
        console.log("Cancelling topic:", application);
        try {
            const response = await api.post(`/student/cancel-topic/${application.topicId}`);
            alert("Successfully cancelled the topic!");
            setAppliedTopics((prev) => prev.filter((applied) => applied.id !== application.id));
        } catch (error) {
            alert(`Failed to cancel the topic.\n${error.response.data.message}`);
            console.error("Error cancelling topic:", error);
        }
    };

    return (
        <div className="topic-container">
            {topicLoading && <div>Loading...</div>}

            {semester && (
                <div className="semester-info">
                    <h1>Semester: {semester.name}</h1>
                </div>
            )}

            {topics.length === 0 && !topicLoading && (
                <div>No topics available for this semester.</div>
            )}
            
            {approvedTopic && (
                <div className="approved-info">
                    <h1>Approved Topic:</h1>
                    <table className="table">
                        <tbody>
                            <tr>
                                <td>Title:</td>
                                <td>{approvedTopic.title}</td>
                            </tr>
                            <tr>
                                <td>Supervisor:</td>
                                <td>{topic.supervisor.fullName}</td>
                            </tr>
                            <tr>
                                <td>Ideas:</td>
                                <td>{approvedTopic.description}</td>
                            </tr>
                            <tr>
                                <td>Status:</td>
                                <td>{approvedTopic.status}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
            
            {appliedTopics.length > 0 && (
                <div className="applied-info">
                    <h1>Applied Topic:</h1>
                    <h2>Please wait for the supervisor's response.</h2>
                    <h2>For any inquiries, please contact the supervisor.</h2>
                    <table className="table">
                        <tbody>
                            {appliedTopics.map((a) => (
                                <tr key={a.id}>
                                    <td>{a.topic.topic}</td>
                                    <td>{a.topic.supervisor.fullName}</td>
                                    <td>{a.status}</td>
                                    <td>
                                        {a.status === 'pending' && (
                                            <button className="btn btn-danger" onClick={() => handleCancelTopic(a)}>Cancel</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {topics.length > 0 && (
                <div className="topic-table" style={{ marginTop: "40px" }}>
                    <h1>Available Topics:</h1>
                    <p>Click on a topic to view details and apply.</p>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Topic</th>
                                <th>Description</th>
                                <th>Slots</th>
                                <th>Supervisor</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topics.map((topic) => (
                                <tr 
                                    key={topic.id}
                                    className="clickable-row"
                                    onClick={() => {
                                        setSelectedTopic(topic);
                                        setOpenModal(true);
                                    }}
                                >
                                    <td>{topic.topic}</td>
                                    <td>{topic.description}</td>
                                    <td>{topic.remainingSlots} / {topic.maximumSlots}</td>
                                    <td>{topic.supervisor.fullName}</td>
                                    <td>
                                        <button className="btn btn-primary">{topic.status === 'open' ? 'Open' : 'Closed'}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Modal remains the same */}
            {openModal && (
                <div className="modal-overlay" onClick={() => { setOpenModal(false); setSelectedTopic(null); }}>
                    <div className="modal-form" onClick={e => e.stopPropagation()}>
                        <h2>Topic Details</h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td><strong>Topic:</strong></td>
                                    <td>{selectedTopic.topic}</td>
                                </tr>
                                <tr>
                                    <td><strong>Slots:</strong></td>
                                    <td>{selectedTopic.remainingSlots} / {selectedTopic.maximumSlots}</td>
                                </tr>
                                <tr>
                                    <td><strong>Supervisor:</strong></td>
                                    <td>{selectedTopic.supervisor.fullName}</td>
                                </tr>
                                <tr>
                                    <td><strong>Supervisor Email:</strong></td>
                                    <td style={{textTransform: "lowercase"}}>{selectedTopic.supervisor.email}</td>
                                </tr>
                                <tr>
                                    <td><strong>Status:</strong></td>
                                    <td>{selectedTopic.status === 'open' ? 'Open' : 'Closed'}</td>
                                </tr>
                                {selectedTopic.description && (
                                    <tr>
                                        <td><strong>Description:</strong></td>
                                        <td>{selectedTopic.description}</td>
                                    </tr>
                                )}
                                {selectedTopic.minGpa && (
                                    <tr>
                                        <td><strong>Minimum GPA:</strong></td>
                                        <td>{selectedTopic.minGpa}</td>
                                    </tr>
                                )}
                                {selectedTopic.minCredits && (
                                    <tr>
                                        <td><strong>Minimum Credits:</strong></td>
                                        <td>{selectedTopic.minCredits}</td>
                                    </tr>
                                )}
                                {selectedTopic.requirements && (
                                    <tr>
                                        <td><strong>Other Requirements:</strong></td>
                                        <td>{selectedTopic.requirements}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td><strong>Your Pre-Thesis Title:</strong></td>
                                    <td>
                                        <textarea
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            rows={2}
                                            placeholder="Enter your pre-thesis title here..."
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>Your Ideas:</strong></td>
                                    <td>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                            placeholder="Enter your ideas here..."
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="modal-actions">
                            <button className="btn btn-save" onClick={() => handleSubmit(selectedTopic)}>Apply</button>
                            <button className="btn btn-cancel" onClick={handleCloseModal}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}