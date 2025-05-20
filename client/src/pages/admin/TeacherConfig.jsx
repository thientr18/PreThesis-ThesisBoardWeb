import React, { useState, useEffect } from "react";
import api from "@/utils/axios";

export default function TeacherConfig() {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState("add"); // "add" or "edit"
    const [formData, setFormData] = useState({
        username: "",
        teacherId: "",
        userId: "",
        fullName: "",
        email: "",
        phone: "",
        birthDate: "",
        address: "",
        status: "",
    });
    const [editTeacherId, setEditTeacherId] = useState(null);
    
    // Handle opening form
    const handleAddClick = () => {
        setFormData({
            username: "",
            teacherId: "",
            userId: "",
            fullName: "",
            email: "",
            phone: "",
            birthDate: "",
            address: "",
            status: "",
        });
        setFormMode("add");
        setShowForm(true);
    };

    const handleEditClick = (t) => {
        setFormMode("edit");
        setEditTeacherId(t.id);
        setFormData({
            username: t.user.username || "",
            teacherId: t.id || "",
            userId: t.userId || "",
            fullName: t.fullName || "",
            email: t.email || "",
            phone: t.phone || "",
            birthDate: t.birthDate ? t.birthDate.slice(0, 10) : "",
            address: t.address || "",
            status: t.status || "",
        });
        setShowForm(true);
    };

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle form submit
    const handleSave = async (e) => {
        e.preventDefault();
        // Validate required fields
        if (!formData.username || !formData.fullName || !formData.email) {
            alert("Please fill in all required fields.");
            return;
        }
        try {
            if (formMode === "add") {
                await api.post("/admin/teachers/new", formData);
            } else {
                await api.put(`/admin/teachers/${editTeacherId}/update`, formData);
            }
            setShowForm(false);
            setFormData({
                username: "",
                teacherId: "",
                userId: "",
                fullName: "",
                email: "",
                phone: "",
                birthDate: "",
                address: "",
                status: "",
            });

            // Refresh list
            const response = await api.get("/admin/teachers");
            setTeachers(response.data);
        } catch (error) {
            setError("Failed to save teacher");
        }
    };

    // Fetch teachers
    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const response = await api.get("/admin/teachers");
                setTeachers(response.data);
            } catch (error) {
                setError("Failed to fetch teachers");
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, []);

    return (
        <div className="config-container">
            <h1>Teacher Configuration</h1>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-form">
                        <h2>{formMode === "add" ? "Add Teacher" : "Edit Teacher"}</h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Teacher ID: <span className="required">*</span></td>
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
                                    <td>Status:</td>
                                    <td>
                                        <select name="status" value={formData.status} onChange={handleChange}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
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

            <button onClick={handleAddClick} className="btn-add-student">
                <img src="/plus-solid.svg" alt="Add new Button" />
            </button>

            {loading && <p>Loading...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && teachers.length === 0 && <p>No teachers found.</p>}

            {!loading && teachers.length > 0 && (
                <table className="teachers-table">
                    <thead>
                        <tr>
                            <th>Teacher ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teachers.map((t) => (
                            <tr key={t.userId}>
                                <td>{t.user.username}</td>
                                <td>{t.fullName}</td>
                                <td>{t.email}</td>
                                <td>{t.phone}</td>
                                <td>{t.status}</td>
                                <td>
                                    <button onClick={() => handleEditClick(t)}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
 