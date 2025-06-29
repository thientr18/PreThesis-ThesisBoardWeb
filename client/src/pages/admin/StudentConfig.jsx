import { useState, useEffect } from 'react';
import api from '../../utils/axios';
import { useAuth } from "@/contexts/AuthContext";

export default function StudentConfig() {
    const { user } = useAuth();
    const [semesters, setSemesters] = useState([]);
    const [semesterId, setSemesterId] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
    const [formData, setFormData] = useState({
        username: '',
        studentId: '',
        userId: '',
        fullName: '',
        email: '',
        phone: '',
        birthDate: '',
        address: '',
        credits: '',
        gpa: '',
        type: '',
        semesterId: semesterId
    });
    const [editStudentId, setEditStudentId] = useState(null);

    const [unregisteredStudents, setUnregisteredStudents] = useState([]);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [assignmentMode, setAssignmentMode] = useState('random'); // 'random' or 'specific'
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [studentTypeFilter, setStudentTypeFilter] = useState('pre-thesis');
    const [availableTopics, setAvailableTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('');

    useEffect(() => {
        if (!user || !user.role) return; // Wait for user to be loaded
        const fetchSemesters = async () => {
            try {
                const response = await api.get(`/${user.role}/semesters`);
                setSemesters(response.data);
                const active = response.data.find((s) => s.isActive);
                if (active) setSemesterId(active.id);
            } catch (err) {
                setError('Failed to load semesters');
            } finally {
                setLoading(false);
            }
        };
        fetchSemesters();
    }, [user]);

    const getStudentTypeLabel = (type) => {
        switch (type) {
            case 'pre-thesis': return 'Pre-Thesis';
            case 'thesis': return 'Thesis';
            case 'failed-pre-thesis': return 'Failed Pre-Thesis';
            case 'failed-thesis': return 'Failed Thesis';
            case null:
            case 'null':
            default: return 'None';
        }
    };

    // Search functionality
    const filteredStudents = students.filter(student => {
        if (!searchTerm) return true;
        
        const searchValue = searchTerm.toLowerCase();
        
        // Search across multiple fields
        const studentId = student.student?.user?.username?.toLowerCase() || '';
        const fullName = student.student?.fullName?.toLowerCase() || '';
        const email = student.student?.email?.toLowerCase() || '';
        const phone = student.student?.phone?.toLowerCase() || '';
        const typeLabel = getStudentTypeLabel(student.type).toLowerCase();
        const status = student.isRegistered ? 'registered' : 'unregistered';
        
        return studentId.includes(searchValue) ||
               fullName.includes(searchValue) ||
               email.includes(searchValue) ||
               phone.includes(searchValue) ||
               typeLabel.includes(searchValue) ||
               status.includes(searchValue);
    });


    // Filter students by type when displaying in the assignment modal
    const filteredUnregisteredStudents = unregisteredStudents.filter(student => {
        if (studentTypeFilter === 'all') return true;
        return student.type === studentTypeFilter;
    });

    // Get unregistered students
    const getUnregisteredStudents = () => {
        return students.filter(student => !student.isRegistered);
    };

    // Handle opening assignment modal
    const handleAssignmentClick = async () => {
        const unregistered = getUnregisteredStudents();
        setUnregisteredStudents(unregistered);
        setSelectedStudents([]);
        
        // Fetch available teachers
        try {
            const response = await api.get(`/${user.role}/teachers/slots?semesterId=${semesterId}`);
            setAvailableTeachers(response.data);
            console.log('Available teachers:', response.data);
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
            alert('Failed to load teachers');
        }
        
        setShowAssignmentModal(true);
    };

    // Handle student selection for assignment
    const handleStudentSelect = (studentId, isSelected) => {
        if (isSelected) {
            if (assignmentMode === 'specific') {
                // For specific assignment, only allow one student at a time
                setSelectedStudents([studentId]); // Replace any previous selection
            } else {
                setSelectedStudents(prev => [...prev, studentId]);
            }
        } else {
            setSelectedStudents(prev => prev.filter(id => id !== studentId));
        }
    };

    // Reset selected students when assignment mode changes
    const handleAssignmentModeChange = (mode) => {
        setAssignmentMode(mode);
        setSelectedStudents([]); // Clear selections when mode changes
        setSelectedTeacher('');
    };

    const handleSelectNone = () => {
        setSelectedStudents([]);
    };

    // Handle assignment submission
    const handleAssignmentSubmit = async () => {
        if (selectedStudents.length === 0) {
            alert('Please select at least one student to assign.');
            return;
        }

        try {
            let endpoint = '';
            let assignmentData = {};

            if (assignmentMode === 'specific') {
                if (studentTypeFilter === 'pre-thesis') {
                    if (!selectedTopic) {
                        alert('Please select a topic for specific assignment.');
                        return;
                    }
                    if (selectedStudents.length > 1) {
                        alert('For specific topic assignment, you can only assign one student at a time.');
                        return;
                    }
                    endpoint = `/${user.role}/students/prethesis-assign-specific`;
                    assignmentData = {
                        studentId: selectedStudents[0],
                        topicId: selectedTopic,
                        semesterId: semesterId
                    };
                } else {
                    if (!selectedTeacher) {
                        alert('Please select a teacher for specific assignment.');
                        return;
                    }
                    if (selectedStudents.length > 1) {
                        alert('For specific teacher assignment, you can only assign one student at a time.');
                        return;
                    }
                    endpoint = `/${user.role}/students/thesis-assign-specific`;
                    assignmentData = {
                        studentId: selectedStudents[0],
                        teacherId: selectedTeacher,
                        semesterId: semesterId
                    };
                }
            } else {
                // Random assignment - multiple students of same type
                if (studentTypeFilter === 'pre-thesis') {
                    endpoint = `/${user.role}/students/prethesis-assign-random`;
                } else {
                    endpoint = `/${user.role}/students/thesis-assign-random`;
                }

                assignmentData = {
                    studentIds: selectedStudents,
                    semesterId: semesterId
                };
            }

            await api.post(endpoint, assignmentData);
            const studentText = selectedStudents.length === 1 ? 'student' : 'students';
            alert(`Successfully assigned ${selectedStudents.length} ${studentTypeFilter === 'pre-thesis' ? 'Pre-Thesis' : 'Thesis'} ${studentText}${assignmentMode === 'specific' ? (studentTypeFilter === 'pre-thesis' ? ' to specific topic' : ' to specific teacher') : ' randomly'}!`);

            setShowAssignmentModal(false);
            setSelectedStudents([]);
            setSelectedTopic('');

            // Refresh students list
            const response = await api.get(`/${user.role}/students?semester=${semesterId}`);
            setStudents(response.data);

        } catch (error) {
            console.error('Assignment failed:', error);
            const errorMessage = error.response?.data?.message || 'Failed to assign students. Please try again.';
            alert(errorMessage);
        }
    };

    // Handle opening form
    const handleAddClick = () => {
        setFormData({
            username: '',
            studentId: '',
            userId: '',
            fullName: '',
            email: '',
            phone: '',
            birthDate: '',
            address: '',
            credits: '',
            gpa: '',
            type: '',
            semesterId: semesterId
        });
        setFormMode('add');
        setShowForm(true);
    };

    const handleEditClick = (s) => {
        setFormMode('edit');
        setEditStudentId(s.studentId);
        setFormData({
            username: s.student.user.username,
            studentId: s.studentId,
            userId: s.student.userId,
            fullName: s.student.fullName,
            email: s.student.email,
            phone: s.student.phone,
            birthDate: s.student.birthDate || '',
            address: s.student.address || '',
            credits: s.student.credits,
            gpa: s.student.gpa,
            type: s.type,
            semesterId: s.semesterId
        });
        setShowForm(true);
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Save button handler
    const handleSave = async () => {
        if (!formData.username || !formData.fullName || !formData.email) {
            alert('Please fill in all required fields.');
            return;
        }
        try {
            if (formMode === 'add') {
                await api.post(`/${user.role}/students/new`, formData);
            } else {
                await api.put(`/${user.role}/students/${editStudentId}/update`, formData);
            }
            setShowForm(false);
            setFormData({});
            // Refresh students
            const response = await api.get(`/${user.role}/students?semester=${semesterId}`);
            setStudents(response.data);
        } catch (error) {
            console.error(error);
            alert('Failed to save student');
        }
    };

    const handleSemesterChange = (event) => {
        setSemesterId(event.target.value);
    };

    const getRegistrationStatus = (isRegistered) => {
        return isRegistered ? 'Registered' : 'Unregistered';
    };

    useEffect(() => {
        const fetchSemesters = async () => {
            try {
                const response = await api.get(`/${user.role}/semesters`);
                setSemesters(response.data);
                const active = response.data.find((s) => s.isActive);
                if (active) setSemesterId(active.id);
            } catch (err) {
                setError('Failed to load semesters');
            } finally {
                setLoading(false);
            }
        };
        fetchSemesters();
    }, []);

    useEffect(() => {
        if (!semesterId) return;
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/${user.role}/students?semester=${semesterId}`);
                setStudents(response.data);
                setError(null);
                console.log('Fetched students:', response.data);
            } catch (err) {
                setError('Failed to load students');
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [semesterId]);

    useEffect(() => {
        const fetchAvailableTopics = async () => {
            if (
                showAssignmentModal &&
                assignmentMode === 'specific' &&
                studentTypeFilter === 'pre-thesis' &&
                semesterId
            ) {
                try {
                    const res = await api.get(`/${user.role}/topics/available?semesterId=${semesterId}`);
                    setAvailableTopics(res.data);
                } catch (err) {
                    setAvailableTopics([]);
                }
            }
        };
        fetchAvailableTopics();
    }, [showAssignmentModal, assignmentMode, studentTypeFilter, semesterId]);

    return (
        <div className="config-container">
            <h1>Student Management</h1>

            {/* Student Assignment Modal */}
            {showAssignmentModal && (
                <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
                    <div className="modal-form enhanced-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Assign Unregistered Students</h2>
                            <button 
                                className="modal-close-btn" 
                                onClick={() => setShowAssignmentModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-content">
                            {unregisteredStudents.length === 0 ? (
                                <div className="empty-state">
                                    <p>No unregistered students found</p>
                                    <span>All students in this semester are already registered.</span>
                                </div>
                            ) : (
                                <>
                                    {/* Type Selection Tabs */}
                                    <div className="form-section">
                                        <div className="section-title">Student Type</div>
                                        <div style={{ 
                                            display: 'flex', 
                                            borderBottom: '1px solid #dee2e6',
                                            marginBottom: '16px'
                                        }}>
                                            {['pre-thesis', 'thesis'].map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => {
                                                        setStudentTypeFilter(type);
                                                        setSelectedStudents([]); // Clear selections when changing type
                                                    }}
                                                    style={{
                                                        padding: '10px 20px',
                                                        background: 'none',
                                                        border: 'none',
                                                        borderBottom: studentTypeFilter === type ? 
                                                            '2px solid #007bff' : '2px solid transparent',
                                                        color: studentTypeFilter === type ? '#007bff' : '#495057',
                                                        fontWeight: studentTypeFilter === type ? '600' : '400',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        flex: 1,
                                                        textAlign: 'center'
                                                    }}
                                                >
                                                    {type === 'pre-thesis' ? 'Pre-Thesis Students' : 'Thesis Students'}
                                                    <span style={{ 
                                                        marginLeft: '8px', 
                                                        backgroundColor: '#f8f9fa',
                                                        color: '#6c757d',
                                                        padding: '2px 6px',
                                                        borderRadius: '10px',
                                                        fontSize: '12px'
                                                    }}>
                                                        {unregisteredStudents.filter(s => s.type === type).length}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Assignment Mode Selection */}
                                    <div className="form-section">
                                        <div className="section-title">
                                            Assignment Mode
                                        </div>
                                        <div className="demo-type-selector">
                                            <label className="radio-label">
                                                <input
                                                    type="radio"
                                                    value="random"
                                                    checked={assignmentMode === 'random'}
                                                    onChange={(e) => handleAssignmentModeChange(e.target.value)}
                                                />
                                                Random Assignment (Multiple Students)
                                            </label>
                                            <label className="radio-label">
                                                <input
                                                    type="radio"
                                                    value="specific"
                                                    checked={assignmentMode === 'specific'}
                                                    onChange={(e) => handleAssignmentModeChange(e.target.value)}
                                                />
                                                Specific {studentTypeFilter === 'pre-thesis' ? 'Topic' : 'Teacher'} (One Student Only)
                                            </label>
                                        </div>
                                        
                                        {assignmentMode === 'specific' && studentTypeFilter === 'pre-thesis' && (
                                            <div className="form-group">
                                                <label className="form-label">Select Topic:</label>
                                                <select 
                                                    className="form-input"
                                                    value={selectedTopic}
                                                    onChange={(e) => setSelectedTopic(e.target.value)}
                                                >
                                                    <option value="">-- Select Topic --</option>
                                                    {availableTopics.map(topic => (
                                                        <option key={topic.id} value={topic.id}>
                                                            {topic.topic} (Supervisor: {topic.supervisorName}) - Slots: {topic.remainingSlots}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {assignmentMode === 'specific' && studentTypeFilter === 'thesis' && (
                                            <div className="form-group">
                                                <label className="form-label">Select Teacher:</label>
                                                <select 
                                                    className="form-input"
                                                    value={selectedTeacher}
                                                    onChange={(e) => setSelectedTeacher(e.target.value)}
                                                >
                                                    <option value="">-- Select Teacher --</option>
                                                    {availableTeachers
                                                        .filter(teacher => teacher.slots.remainingThesis > 0)
                                                        .map(teacher => (
                                                        <option key={teacher.userId} value={teacher.userId}>
                                                            {teacher.fullName} ({teacher.user.username}) - Thesis: {teacher.slots.remainingThesis}/{teacher.slots.maxThesis}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {/* --- END CHANGE --- */}

                                        {assignmentMode === 'specific' && (
                                            <div className="assignment-notice" style={{
                                                background: '#fff3cd',
                                                color: '#856404',
                                                padding: '12px',
                                                borderRadius: '6px',
                                                marginTop: '12px',
                                                border: '1px solid #ffeaa7',
                                                fontSize: '14px'
                                            }}>
                                                <strong>⚠️ Note:</strong> For specific assignment, you can only select and assign one student at a time to ensure proper slot management.
                                            </div>
                                        )}
                                    </div>

                                    {/* Student Selection */}
                                    <div className="form-section">
                                        <div className="section-title">
                                            Select {studentTypeFilter !== 'all' ? 
                                                    (studentTypeFilter === 'pre-thesis' ? 'Pre-Thesis' : 'Thesis') : 
                                                    ''} Students to Assign 
                                            ({selectedStudents.length} of {filteredUnregisteredStudents.length} selected)
                                            {assignmentMode === 'specific' && (
                                                <span style={{ fontSize: '14px', color: '#dc3545', fontWeight: 'normal' }}>
                                                    {' '}(Max: 1 student)
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="waiting-semesters-controls">
                                            <div className="control-buttons">
                                                <button 
                                                    className="btn-control select-all"
                                                    onClick={() => {
                                                        if (assignmentMode === 'specific') {
                                                            alert('For specific teacher assignment, you can only select one student at a time.');
                                                            return;
                                                        }
                                                        
                                                        // For random assignment, allow selecting all visible students
                                                        const visibleStudentIds = filteredUnregisteredStudents.map(s => s.studentId);
                                                        setSelectedStudents(visibleStudentIds);
                                                    }}
                                                    disabled={assignmentMode === 'specific'}
                                                    style={{
                                                        opacity: assignmentMode === 'specific' ? 0.5 : 1,
                                                        cursor: assignmentMode === 'specific' ? 'not-allowed' : 'pointer'
                                                    }}
                                                    title={assignmentMode === 'specific' ? 'Not available for specific teacher assignment' : 'Select all students'}
                                                >
                                                    Select All
                                                </button>
                                                <button 
                                                    className="btn-control deselect-all"
                                                    onClick={handleSelectNone}
                                                >
                                                    Select None
                                                </button>
                                            </div>
                                            <span className="semester-count">
                                                {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''} selected
                                                {assignmentMode === 'specific' && selectedStudents.length > 0 && (
                                                    <span style={{ color: '#28a745', marginLeft: '8px' }}>✓</span>
                                                )}
                                            </span>
                                        </div>
                                        
                                        {/* List of students filtered by type */}
                                        {filteredUnregisteredStudents.length === 0 ? (
                                            <div style={{
                                                padding: '20px',
                                                textAlign: 'center',
                                                color: '#6c757d',
                                                fontStyle: 'italic',
                                                marginTop: '16px'
                                            }}>
                                                No {studentTypeFilter !== 'all' ? 
                                                    (studentTypeFilter === 'pre-thesis' ? 'pre-thesis' : 'thesis') : 
                                                    ''} students found.
                                            </div>
                                        ) : (
                                            <div style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: '12px', 
                                                marginTop: '16px',
                                                maxHeight: '400px',
                                                overflowY: 'auto',
                                                padding: '8px'
                                            }}>
                                                {filteredUnregisteredStudents.map(student => {
                                                    const isSelected = selectedStudents.includes(student.studentId);
                                                    const isDisabled = assignmentMode === 'specific' && selectedStudents.length > 0 && !isSelected;
                                                    
                                                    return (
                                                        <div 
                                                            key={student.studentId} 
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                padding: '16px',
                                                                border: '1px solid #e0e0e0',
                                                                borderRadius: '8px',
                                                                backgroundColor: isSelected ? '#f0f8ff' : '#fff',
                                                                opacity: isDisabled ? 0.6 : 1,
                                                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                borderColor: isSelected ? '#007bff' : '#e0e0e0'
                                                            }}
                                                            onClick={() => {
                                                                if (!isDisabled) {
                                                                    handleStudentSelect(student.studentId, !isSelected);
                                                                }
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStudentSelect(student.studentId, e.target.checked);
                                                                }}
                                                                disabled={isDisabled}
                                                                style={{
                                                                    marginRight: '12px',
                                                                    width: '18px',
                                                                    height: '18px',
                                                                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                                                                }}
                                                            />
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ 
                                                                    fontSize: '16px', 
                                                                    fontWeight: '500', 
                                                                    marginBottom: '4px',
                                                                    color: isDisabled ? '#6c757d' : '#333'
                                                                }}>
                                                                    {student.student.fullName}
                                                                    {isDisabled && (
                                                                        <span style={{ 
                                                                            fontSize: '12px', 
                                                                            color: '#6c757d', 
                                                                            marginLeft: '8px',
                                                                            fontStyle: 'italic'
                                                                        }}>
                                                                            (Select only one for specific assignment)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ 
                                                                    fontSize: '14px', 
                                                                    color: '#666', 
                                                                    marginBottom: '8px' 
                                                                }}>
                                                                    ID: {student.student.user.username} | Email: {student.student.email}
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <span style={{
                                                                        padding: '4px 8px',
                                                                        backgroundColor: student.type === 'pre-thesis' ? '#e3f2fd' : '#f3e5f5',
                                                                        color: student.type === 'pre-thesis' ? '#1976d2' : '#7b1fa2',
                                                                        borderRadius: '4px',
                                                                        fontSize: '12px',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        {getStudentTypeLabel(student.type)}
                                                                    </span>
                                                                    <span style={{
                                                                        padding: '4px 8px',
                                                                        backgroundColor: '#f1f3f5',
                                                                        color: '#495057',
                                                                        borderRadius: '4px',
                                                                        fontSize: '12px',
                                                                        fontWeight: '500'
                                                                    }}>
                                                                        GPA: {student.student.gpa || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {filteredUnregisteredStudents.length > 0 && (
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowAssignmentModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleAssignmentSubmit}
                                    disabled={selectedStudents.length === 0}
                                >
                                    Assign {selectedStudents.length}
                                    {studentTypeFilter === 'pre-thesis' ? ' Pre-Thesis' : ' Thesis'} Student{selectedStudents.length !== 1 ? 's' : ''}
                                    {assignmentMode === 'specific' && selectedStudents.length === 1 && (
                                        <span style={{ marginLeft: '4px' }}>to Specific Teacher</span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Form */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-form" onClick={(e) => e.stopPropagation()}>
                        <h2>{formMode === 'add' ? 'Add Student' : 'Edit Student'}</h2>
                        <table className="table">
                            <tbody>
                                <tr>
                                    <td>Student ID: <span className="required">*</span></td>
                                    <td>
                                        <input type="text" name="username" value={formData.username} onChange={handleChange} disabled={formMode === 'edit'} required />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Full Name: <span className="required">*</span></td>
                                    <td>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Email: <span className="required">*</span></td>
                                    <td>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Phone:</td>
                                    <td>
                                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Birthday:</td>
                                    <td>
                                        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Address:</td>
                                    <td>
                                        <input type="text" name="address" value={formData.address} onChange={handleChange} />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Credits:</td>
                                    <td>
                                        <input type="number" name="credits" value={formData.credits} onChange={handleChange} />
                                    </td>
                                </tr>
                                <tr>
                                    <td>GPA (on scale 4):</td>
                                    <td>
                                        <input type="number" name="gpa" step="0.01" max="4" value={formData.gpa} onChange={handleChange} />
                                    </td>
                                </tr>
                                <tr>
                                    <td>Student Type:</td>
                                    <td>
                                        <select name="type" value={formData.type} onChange={handleChange}>
                                            <option value="null">None</option>
                                            <option value="pre-thesis">Pre-Thesis</option>
                                            <option value="thesis">Thesis</option>
                                        </select>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="modal-actions">
                            <button onClick={handleSave} className="btn-save">Save</button>
                            <button onClick={() => setShowForm(false)} className="btn-cancel">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Semester Select */}
            <div className="semester-container">
                <div className="semester-select">
                    <label htmlFor="semester">Choose a semester:</label>
                    <select id="semester" value={semesterId} onChange={handleSemesterChange}>
                        <option value="">-- Select Semester --</option>
                        {semesters.map((s) => (
                            <option key={s.id} value={s.id} className={s.isActive ? 'active' : 'inactive'}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="control-buttons">
                    <button onClick={handleAddClick} className="btn-add-student">
                        <img src="/plus-solid.svg" alt="Add new Button" />
                    </button>
                    <button 
                        onClick={handleAssignmentClick} 
                        className="btn btn-primary"
                        disabled={getUnregisteredStudents().length === 0}
                        style={{ marginLeft: '12px' }}
                    >
                        Assign Unregistered ({getUnregisteredStudents().length})
                    </button>
                </div>
            </div>

            {/* Search Controls */}
            <div className="search-controls" style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: '400px', flex: 1 }}>
                        <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                            Search Students:
                        </label>
                        <input
                            type="text"
                            placeholder="Search by Student ID, Name, Email, Phone, Type, or Status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                padding: '12px 16px', 
                                borderRadius: '6px', 
                                border: '1px solid #ccc',
                                fontSize: '14px',
                                boxShadow: searchTerm ? '0 0 0 2px rgba(32, 150, 242, 0.2)' : 'none',
                                transition: 'box-shadow 0.2s ease'
                            }}
                        />
                    </div>
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            style={{ 
                                padding: '12px 16px', 
                                background: '#6c757d', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '6px',
                                cursor: 'pointer',
                                alignSelf: 'flex-end',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Clear Search
                        </button>
                    )}
                </div>
                <div style={{ 
                    marginTop: '12px', 
                    fontSize: '14px', 
                    color: '#666',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>
                        Showing {filteredStudents.length} of {students.length} students
                        {searchTerm && ` matching "${searchTerm}"`}
                    </span>
                    {searchTerm && (
                        <span style={{ fontSize: '12px', color: '#888' }}>
                            Searches: ID, Name, Email, Phone, Type, Status
                        </span>
                    )}
                </div>
            </div>

            {/* Students Table */}
            {loading && <p>Loading...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && students.length === 0 && <p>No students found.</p>}

            {!loading && students.length > 0 && (
                <table className="students-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Type</th>
                            <th>Registration Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map((s) => (
                            <tr key={s.student.userId}>
                                <td>{s.student?.user.username || 0}</td>
                                <td>{s.student.fullName}</td>
                                <td>{s.student.email}</td>
                                <td>{s.student.phone}</td>
                                <td>{getStudentTypeLabel(s.type)}</td>
                                <td>
                                    <span 
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            background: s.isRegistered ? '#d4edda' : '#fff3cd',
                                            color: s.isRegistered ? '#155724' : '#856404',
                                            border: `1px solid ${s.isRegistered ? '#c3e6cb' : '#ffeaa7'}`
                                        }}
                                    >
                                        {getRegistrationStatus(s.isRegistered)}
                                    </span>
                                </td>
                                <td>
                                    <button onClick={() => handleEditClick(s)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}