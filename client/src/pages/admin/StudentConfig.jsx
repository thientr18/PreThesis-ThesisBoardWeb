import React, { useState, useEffect } from 'react';
import api from '../../utils/axios';

export default function StudentConfig() {
    const [semesters, setSemesters] = useState([]);
    const [semesterId, setSemesterId] = useState('');
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                await api.post('/admin/students/new', formData);
            } else {
                await api.put(`/admin/students/${editStudentId}/update`, formData);
            }
            setShowForm(false);
            setFormData({});
            // Refresh students
            const response = await api.get(`/admin/students?semester=${semesterId}`);
            setStudents(response.data);
        } catch (error) {
            console.error(error);
            alert('Failed to save student');
        }
    };

    const handleSemesterChange = (event) => {
        setSemesterId(event.target.value);
    };

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

    useEffect(() => {
        const fetchSemesters = async () => {
            try {
                const response = await api.get('/admin/semesters');
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
                const response = await api.get(`/admin/students?semester=${semesterId}`);
                setStudents(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to load students');
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [semesterId]);

    return (
        <div className="config-container">
            <h1>Student Config</h1>
            {/* Modal Form */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-form">
                        <h2>{formMode === 'add' ? 'Add Student' : 'Edit Student'}</h2>
                        <table>
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
                                            <option value="failed-pre-thesis">Failed Pre-Thesis</option>
                                            <option value="failed-thesis">Failed Thesis</option>
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
                
                <button onClick={handleAddClick} className="btn-add-student">
                    <img src="/plus-solid.svg" alt="Add new Button" />
                </button>
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
                            <th>Credits</th>
                            <th>GPA</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s) => (
                            <tr key={s.student.userId}>
                                <td>{s.student.user.username}</td>
                                <td>{s.student.fullName}</td>
                                <td>{s.student.email}</td>
                                <td>{s.student.phone}</td>
                                <td>{s.student.credits}</td>
                                <td>{s.student.gpa}</td>
                                <td>{getStudentTypeLabel(s.type)}</td>
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
