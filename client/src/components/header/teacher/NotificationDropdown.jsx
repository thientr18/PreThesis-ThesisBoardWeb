import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/axios";

export default function NotificationDropdown({ notifications = [], setNotifications, setUnreadCount }) {
    const navigate = useNavigate();

    const handleClick = async (id) => {
        try {
            await api.patch(`/teacher/notifications/${id}/read`);
            const updated = notifications.map(n =>
                n._id === id ? { ...n, isRead: true } : n
            );
            setNotifications(updated);
            setUnreadCount(updated.filter(n => !n.isRead).length);
        } catch (error) {
            console.log(error);
        }
        navigate(`/notifications/${id}`);
    };

    return (
        <div className="notification-dropdown">
            {notifications.length === 0 ? (
                <div className="empty-message">No notifications</div>
            ) : (
                notifications.map((notification) => (
                    <div
                        key={notification._id}
                        className={`notification-item${notification.isRead ? '' : ' unread'}`}
                        onClick={() => handleClick(notification._id)}
                    >
                        <div className="notification-title">
                            {notification.title 
                                ? (notification.title.length > 60
                                    ? notification.title.slice(0, 60) + "..."
                                    : notification.title)
                                : "No Title"}
                        </div>
                        <div className="notification-snippet">
                            {notification.message
                                ? (notification.message.length > 60
                                    ? notification.message.slice(0, 60) + "..."
                                    : notification.message)
                                : "No Content"}
                        </div>
                    </div>
                ))
            )}
            {notifications.length > 0 && (
                <div className="view-all-notifications">
                    <button 
                        className="view-all-btn"
                        onClick={() => navigate('/teacher/notifications')}
                    >
                        View All Notifications
                    </button>
                </div>
            )}
        </div>
    );
}