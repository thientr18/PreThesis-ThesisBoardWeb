import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "@/utils/axios";

const Announcements = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    
    const [showModal, setShowModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        targetAudience: 'all',
        expiresAt: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterAudience, setFilterAudience] = useState('all');

    const canManage = user?.role === 'admin' || user?.role === 'moderator';

    useEffect(() => {
        if (!user || !user.role) return;
        fetchAnnouncements();
    }, [user]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);

            const response = await api.get(`/announcement`);
            console.log('Fetched announcements:', response.data); // Debug log
            console.log('Current user role:', user?.role); // Debug log
            setAnnouncements(response.data || []);
            setError("");
        } catch (error) {
            console.error("Error fetching announcements:", error);
            setError("Failed to load announcements");
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title || !formData.content) {
            setError("Title and content are required");
            return;
        }

        try {
            const submitData = {
                ...formData,
                expiresAt: formData.expiresAt || null
            };

            if (editingAnnouncement) {
                await api.put(`/announcement/${editingAnnouncement._id}`, submitData);
                setSuccess("Announcement updated successfully!");
            } else {
                await api.post(`/announcement`, submitData);
                setSuccess("Announcement created successfully!");
            }

            setShowModal(false);
            resetForm();
            fetchAnnouncements();
        } catch (error) {
            console.error("Error saving announcement:", error);
            setError(error.response?.data?.error || "Failed to save announcement");
        }
    };

    const handleEdit = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            targetAudience: announcement.targetAudience || 'all',
            expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) {
            return;
        }

        try {
            await api.delete(`/announcement/${id}`);
            setSuccess("Announcement deleted successfully!");
            fetchAnnouncements();
        } catch (error) {
            console.error("Error deleting announcement:", error);
            setError("Failed to delete announcement");
        }
    };

    const resetForm = () => {
            setFormData({
                title: '',
                content: '',
                targetAudience: 'all',
                expiresAt: ''
            });
            setEditingAnnouncement(null);
            setError("");
        };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const filteredAnnouncements = announcements.filter(announcement => {
        const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesAudience = filterAudience === 'all' || 
                              announcement.targetAudience === 'all' ||
                              announcement.targetAudience === filterAudience;
        
        return matchesSearch && matchesAudience;
    });

    const getAudienceLabel = (audience) => {
        // Handle array format from database
        const audienceValue = Array.isArray(audience) ? audience[0] : audience;
        
        // Handle null, undefined, or non-string values
        if (!audienceValue || typeof audienceValue !== 'string') {
            return 'Everyone';
        }
        
        if (audienceValue === 'all') return 'Everyone';
        if (audienceValue === 'student') return 'Students';
        if (audienceValue === 'teacher') return 'Teachers';
        
        // Fallback for any other string values
        return audienceValue.charAt(0).toUpperCase() + audienceValue.slice(1);
    };

    const isExpired = (expiresAt) => {
        return expiresAt && new Date(expiresAt) < new Date();
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleAnnouncementClick = (announcementId) => {
        switch (user.role) {
            case 'admin':
                navigate(`/admin/announcement/${announcementId}`);
            case 'moderator':
                navigate(`/moderator/announcement/${announcementId}`);
                break;
            case 'teacher':
                navigate(`/teacher/announcement/${announcementId}`);
                break;
            case 'student':
                navigate(`/announcement/${announcementId}`);
                break;
            default:
                break;
        }
    };

    return (
        <div className="config-container">
            <div className="config-header">
                <h1>Announcements</h1>
                <p className="config-subtitle">
                    {canManage ? 'Manage and view announcements' : 'View announcements'}
                </p>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                    {success}
                </div>
            )}

            <div className="config-content">
                {/* Controls */}
                <div className="semester-selection-card">
                    <div className="card-header">
                        <h3>Announcements ({filteredAnnouncements.length})</h3>
                        {canManage && (
                            <button 
                                onClick={() => {
                                    resetForm();
                                    setShowModal(true);
                                }}
                                className="btn-add-semester"
                                title="Create New Announcement"
                            >
                                <img src="/plus-solid.svg" alt="Add" />
                                <span>New Announcement</span>
                            </button>
                        )}
                    </div>

                    {/* Filters - Only show for admin/moderator */}
                    {(user?.role === 'admin' || user?.role === 'moderator') && (
                        <div className="form-grid" style={{ marginTop: '20px' }}>
                            <div className="form-group">
                                <label>Search Announcements:</label>
                                <input
                                    type="text"
                                    placeholder="Search by title or content..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Filter by Audience:</label>
                                <select
                                    value={filterAudience}
                                    onChange={(e) => setFilterAudience(e.target.value)}
                                    className="form-input"
                                >
                                    <option value="all">All Audiences</option>
                                    <option value="student">Students</option>
                                    <option value="teacher">Teachers</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Simple search for students and teachers */}
                    {(user?.role === 'student' || user?.role === 'teacher') && (
                        <div style={{ marginTop: '20px' }}>
                            <div className="form-group">
                                <label>Search Announcements:</label>
                                <input
                                    type="text"
                                    placeholder="Search by title or content..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="form-input"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Announcements List */}
                <div className="announcements-container">
                    {loading ? (
                        <div className="empty-state">
                            <p>Loading announcements...</p>
                        </div>
                    ) : filteredAnnouncements.length === 0 ? (
                        <div className="empty-state">
                            <img src="/bullhorn-solid.svg" alt="No announcements" className="empty-icon" />
                            <p>No announcements found</p>
                            <span>
                                {searchTerm || filterAudience !== 'all' 
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'Check back later for new announcements'
                                }
                            </span>
                        </div>
                    ) : (
                        <div className="announcements-grid">
                            {filteredAnnouncements.map((announcement) => (
                                <div 
                                    key={announcement._id} 
                                    className={`announcement-card ${isExpired(announcement.expiresAt) ? 'expired' : ''} clickable-announcement`}
                                    onClick={() => handleAnnouncementClick(announcement._id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="announcement-header">
                                        <h3 className="announcement-title">{announcement.title}</h3>
                                        {canManage && (
                                            <div className="announcement-actions">
                                                <button
                                                    onClick={() => handleEdit(announcement)}
                                                    className="btn-edit"
                                                    title="Edit Announcement"
                                                >
                                                    <img src="/pen-to-square-solid.svg" alt="Edit" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(announcement._id)}
                                                    className="btn-delete"
                                                    title="Delete Announcement"
                                                >
                                                    <img src="/trash-can-solid.svg" alt="Delete" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="announcement-meta">
                                        <div className="meta-item">
                                            <span className="meta-label">Audience:</span>
                                            <span className="audience-badge">
                                                {getAudienceLabel(announcement.targetAudience)}
                                            </span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-label">Posted:</span>
                                            <span>{formatDate(announcement.createdAt)}</span>
                                        </div>
                                        {announcement.expiresAt && (
                                            <div className="meta-item">
                                                <span className="meta-label">Expires:</span>
                                                <span className={isExpired(announcement.expiresAt) ? 'expired-text' : ''}>
                                                    {formatDate(announcement.expiresAt)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="announcement-content">
                                        <p>
                                            {announcement.content && announcement.content.length > 150
                                                ? announcement.content.slice(0, 150) + "..."
                                                : announcement.content || "No content"}
                                        </p>
                                    </div>

                                    {isExpired(announcement.expiresAt) && (
                                        <div className="expired-notice">
                                            This announcement has expired
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-form enhanced-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}</h2>
                            <button 
                                className="modal-close-btn"
                                onClick={() => setShowModal(false)}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-content">
                            <div className="form-section">
                                <h3 className="section-title">
                                    <img src="/bullhorn-solid.svg" alt="" className="section-icon" />
                                    Announcement Details
                                </h3>
                                
                                <div className="form-grid">
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label htmlFor="title">
                                            Title <span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="Enter announcement title"
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label htmlFor="content">
                                            Content <span className="required">*</span>
                                        </label>
                                        <textarea
                                            id="content"
                                            name="content"
                                            value={formData.content}
                                            onChange={handleChange}
                                            placeholder="Enter announcement content"
                                            className="form-input"
                                            rows="6"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Target Audience <span className="required">*</span></label>
                                        <div className="radio-group">
                                            {[
                                                { value: 'all', label: 'Everyone' },
                                                { value: 'student', label: 'Students' },
                                                { value: 'teacher', label: 'Teachers' }
                                            ].map(option => (
                                                <label key={option.value} className="radio-label">
                                                    <input
                                                        type="radio"
                                                        name="targetAudience"
                                                        value={option.value}
                                                        checked={formData.targetAudience === option.value}
                                                        onChange={handleChange}
                                                    />
                                                    <span>{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="expiresAt">Expiration Date (Optional)</label>
                                        <input
                                            type="date"
                                            id="expiresAt"
                                            name="expiresAt"
                                            value={formData.expiresAt}
                                            onChange={handleChange}
                                            className="form-input"
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                        <small className="field-description">
                                            Leave empty for permanent announcement
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)} 
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    <img src="/floppy-disk-solid.svg" alt="" className="btn-icon" />
                                    {editingAnnouncement ? 'Update' : 'Create'} Announcement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;