import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/axios';

const Announcement = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            fetchAnnouncement();
        }
    }, [id]);

    const fetchAnnouncement = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/announcement/${id}`);
            setAnnouncement(response.data);
            setError('');
        } catch (error) {
            console.error('Error fetching announcement:', error);
            if (error.response?.status === 404) {
                setError('Announcement not found');
            } else {
                setError('Failed to load announcement');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        switch (user.role) {
            case 'admin':
                navigate('/admin/announcements');
                break;
            case 'moderator':
                navigate('/moderator/announcements');
                break;
            case 'teacher':
                navigate('/teacher/');
                break;
            case 'student':
                navigate('/');
                break;
            default:
                break;
        }
    };

    const getAudienceLabel = (audience) => {
        const audienceValue = Array.isArray(audience) ? audience[0] : audience;
        
        if (!audienceValue || typeof audienceValue !== 'string') {
            return 'Everyone';
        }
        
        if (audienceValue === 'all') return 'Everyone';
        if (audienceValue === 'student') return 'Students';
        if (audienceValue === 'teacher') return 'Teachers';
        
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

    if (loading) {
        return (
            <div className="announcement-page">
                <div className="announcement-container">
                    <div className="announcement-header">
                        <button 
                            className="announcement-back-btn"
                            onClick={handleBack}
                        >
                            ← Back to Announcements
                        </button>
                        <h1>Loading...</h1>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !announcement) {
        return (
            <div className="announcement-page">
                <div className="no-announcement">
                    <div className="announcement-header">
                        <button 
                            className="announcement-back-btn"
                            onClick={handleBack}
                        >
                            ← Back to Announcements
                        </button>
                    </div>
                    <div className="empty-icon">📢</div>
                    <h2>{error || 'Announcement not found'}</h2>
                    <p>The announcement you're looking for doesn't exist or has been removed.</p>
                    <button 
                        className="announcement-back-btn"
                        onClick={handleBack}
                    >
                        Back to Announcements
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="announcement-page">
            <div className="announcement-container">
                <div className="announcement-header">
                    <button 
                        className="announcement-back-btn"
                        onClick={handleBack}
                    >
                        ← Back to Announcements
                    </button>
                    <h1>Announcement</h1>
                </div>

                <div className={`announcement-content-wrapper ${isExpired(announcement.expiresAt) ? 'expired' : ''}`}>
                    {/* Announcement Title */}
                    <div className="announcement-title-section">
                        <h2 className="announcement-page-title">{announcement.title}</h2>
                        {isExpired(announcement.expiresAt) && (
                            <div className="expired-badge">
                                Expired
                            </div>
                        )}
                    </div>

                    {/* Announcement Meta Information */}
                    <div className="announcement-meta-section">
                        <div className="meta-grid">
                            <div className="meta-item">
                                <span className="meta-label">
                                    <img src="/users-solid.svg" alt="Audience" className="meta-icon" />
                                    Target Audience:
                                </span>
                                <span className="audience-badge-large">
                                    {getAudienceLabel(announcement.targetAudience)}
                                </span>
                            </div>
                            
                            <div className="meta-item">
                                <span className="meta-label">
                                    <img src="/calendar-days-solid.svg" alt="Posted" className="meta-icon" />
                                    Posted:
                                </span>
                                <span className="meta-value">
                                    {formatDate(announcement.createdAt)}
                                </span>
                            </div>

                            {announcement.expiresAt && (
                                <div className="meta-item">
                                    <span className="meta-label">
                                        <img src="/clock-solid.svg" alt="Expires" className="meta-icon" />
                                        {isExpired(announcement.expiresAt) ? 'Expired:' : 'Expires:'}
                                    </span>
                                    <span className={`meta-value ${isExpired(announcement.expiresAt) ? 'expired-text' : ''}`}>
                                        {formatDate(announcement.expiresAt)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Announcement Content */}
                    <div className="announcement-message-section">
                        <h3 className="section-title">
                            <img src="/file-lines-solid.svg" alt="Content" className="section-icon" />
                            Content
                        </h3>
                        <div className="announcement-message">
                            <p>{announcement.content || 'No content available'}</p>
                        </div>
                    </div>

                    {/* Expired Notice */}
                    {isExpired(announcement.expiresAt) && (
                        <div className="announcement-expired-notice">
                            <img src="/triangle-exclamation-solid.svg" alt="Warning" className="warning-icon" />
                            <div>
                                <h4>This announcement has expired</h4>
                                <p>The information in this announcement may no longer be current or relevant.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Announcement;