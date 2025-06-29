import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/utils/axios";

const Notifications = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        if (!user || !user.id) return;
        fetchAllNotifications();
    }, [user]);

    const fetchAllNotifications = async () => {
        try {
            setLoading(true);
            const endpoint = user.role === 'admin' ? '/admin/notifications/all' : 
                           user.role === 'moderator' ? '/moderator/notifications/all' :
                           user.role === 'teacher' ? '/teacher/notifications/all' :
                           '/student/notifications/all';
            
            const response = await api.get(endpoint);
            setNotifications(response.data || []);
            setError("");
        } catch (error) {
            console.error("Error fetching notifications:", error);
            setError("Failed to load notifications");
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            // Mark as read if not already read
            if (!notification.isRead) {
                const endpoint = user.role === 'admin' ? `/admin/notifications/${notification._id}/read` :
                               user.role === 'moderator' ? `/moderator/notifications/${notification._id}/read` :
                               user.role === 'teacher' ? `/teacher/notifications/${notification._id}/read` :
                               `/student/notifications/${notification._id}/read`;
                
                await api.patch(endpoint);
                
                // Update local state
                setNotifications(prev => 
                    prev.map(n => 
                        n._id === notification._id ? { ...n, isRead: true, readAt: new Date() } : n
                    )
                );
            }

            // Navigate to individual notification page
            navigate(`/notification/${notification._id}`, {
                state: { notification: { ...notification, isRead: true } }
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
            // Still navigate even if marking as read fails
            navigate(`/notification/${notification._id}`, {
                state: { notification }
            });
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.isRead);
            
            // Mark all unread notifications as read
            await Promise.all(
                unreadNotifications.map(notification => {
                    const endpoint = user.role === 'admin' ? `/admin/notifications/${notification._id}/read` :
                                   user.role === 'moderator' ? `/moderator/notifications/${notification._id}/read` :
                                   user.role === 'teacher' ? `/teacher/notifications/${notification._id}/read` :
                                   `/student/notifications/${notification._id}/read`;
                    return api.patch(endpoint);
                })
            );

            // Update local state
            setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
            );
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            setError("Failed to mark all notifications as read");
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch = notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            notification.message?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === "all" || notification.type === filterType;
        
        const matchesStatus = filterStatus === "all" || 
                            (filterStatus === "read" && notification.isRead) ||
                            (filterStatus === "unread" && !notification.isRead);
        
        return matchesSearch && matchesType && matchesStatus;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'system': return '⚙️';
            case 'reminder': return '⏰';
            case 'message': return '✉️';
            case 'alert': return '⚠️';
            default: return '🔔';
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="config-container">
            <div className="config-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button 
                            onClick={() => navigate(-1)} 
                            className="notification-back-btn"
                            title="Go Back"
                        >
                            ← Back
                        </button>
                        <div>
                            <h1>All Notifications</h1>
                            <p className="config-subtitle">
                                {notifications.length} total notifications
                                {unreadCount > 0 && ` • ${unreadCount} unread`}
                            </p>
                        </div>
                    </div>
                    
                    {unreadCount > 0 && (
                        <button 
                            onClick={markAllAsRead}
                            className="btn btn-secondary"
                        >
                            Mark All as Read
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

            <div className="config-content">
                {/* Filters */}
                <div className="semester-selection-card">
                    <div className="card-header">
                        <h3>Filter Notifications</h3>
                    </div>
                    
                    <div className="form-grid" style={{ marginTop: '20px' }}>
                        <div className="form-group">
                            <label>Search:</label>
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Type:</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="form-input"
                            >
                                <option value="all">All Types</option>
                                <option value="system">System</option>
                                <option value="reminder">Reminder</option>
                                <option value="message">Message</option>
                                <option value="alert">Alert</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>Status:</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="form-input"
                            >
                                <option value="all">All</option>
                                <option value="unread">Unread</option>
                                <option value="read">Read</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="notifications-list-container">
                    {loading ? (
                        <div className="empty-state">
                            <p>Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🔔</div>
                            <p>No notifications found</p>
                            <span>
                                {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'You have no notifications at this time'
                                }
                            </span>
                        </div>
                    ) : (
                        <div className="notifications-list">
                            {filteredNotifications.map((notification) => (
                                <div 
                                    key={notification._id} 
                                    className={`notification-list-item ${!notification.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon">
                                        <span className="notification-emoji">
                                            {getNotificationIcon(notification.type)}
                                        </span>
                                    </div>
                                    
                                    <div className="notification-content">
                                        <div className="notification-header">
                                            <h3 className="notification-title">
                                                {notification.title || "No Title"}
                                            </h3>
                                            <div className="notification-meta">
                                                <span className={`notification-type ${notification.type}`}>
                                                    {notification.type}
                                                </span>
                                                <span className="notification-date">
                                                    {formatDate(notification.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <p className="notification-message">
                                            {notification.message && notification.message.length > 150
                                                ? notification.message.slice(0, 150) + "..."
                                                : notification.message || "No content"}
                                        </p>
                                        
                                        {notification.isRead && notification.readAt && (
                                            <div className="notification-read-info">
                                                Read on {formatDate(notification.readAt)}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {!notification.isRead && (
                                        <div className="notification-unread-indicator"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;