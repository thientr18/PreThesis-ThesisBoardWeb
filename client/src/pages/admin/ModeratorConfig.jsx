import React, { useState, useEffect } from "react";
import api from "@/utils/axios";

export default function ModeratorConfig() {
    const [moderators, setModerators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState("add"); // "add" or "edit"
    const [formData, setFormData] = useState({
        username: "",
        moderatorId: "",
        userId: "",
        fullName: "",
        email: "",
        phone: "",
        birthDate: "",
        address: "",
        status: "",
    });
    const [editModeratorId, setEditModeratorId] = useState(null);

    // Handle opening form
    const handleAddClick = () => {
        setFormData({
            username: "",
            moderatorId: "",
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

    const handleEditClick = (m) => {
        setFormMode("edit");
        setEditModeratorId(m.id);
        setFormData({
            username: m.user.username || "",
            moderatorId: m.id || "",
            userId: m.userId || "",
            fullName: m.fullName || "",
            email: m.email || "",
            phone: m.phone || "",
            birthDate: m.birthDate ? m.birthDate.slice(0, 10) : "",
            address: m.address || "",
            status: m.status || "",
        });
        setShowForm(true);
    };

    // Handle input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle form submission
    const handleSave = async (e) => {
        e.preventDefault();
        // Validate form data
        if (!formData.username || !formData.fullName || !formData.email) {
            alert("Please fill in all required fields.");
            return;
        }
        try {
            if (formMode === "add") {
                await api.post("/admin/moderators/new", formData);
            } else {
                await api.put(`/admin/moderators/${editModeratorId}/update`, formData);
            }
            setShowForm(false);
            setFormData({
                username: "",
                moderatorId: "",
                userId: "",
                fullName: "",
                email: "",
                phone: "",
                birthDate: "",
                address: "",
                status: "",
            });

            // Refresh the list of moderators
            const response = await api.get("/admin/moderators");
            setModerators(response.data);
        } catch (err) {
            setError("Failed to save moderator data.");
        }
    };

    // Fetch moderators
    useEffect(() => {
        const fetchModerators = async () => {
            try {
                const response = await api.get("/admin/moderators");
                setModerators(response.data);
            } catch (err) {
                setError("Failed to fetch moderators.");
            } finally {
                setLoading(false);
            }
        };
        fetchModerators();
    }, []);

    return (
        <div className="config-container">
            <h1>Moderator Configuration</h1>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-form">
                        <h2>{formMode === "add" ? "Add Moderator" : "Add Moderator"}</h2>
                        <table>
                            <tbody>
                                <tr>
                                    <td>Moderator ID: <span className="required">*</span></td>
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
            {!loading && moderators.length === 0 && <p>No moderators found.</p>}

            {!loading && moderators.length > 0 && (
                <table className="moderators-table">
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
                        {moderators.map((t) => (
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
