import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/axios";
import socket from "@/utils/socket";

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.get('/teacher/notifications');
                const data = Array.isArray(response.data.notifications)
                    ? response.data.notifications
                    : [];
                setNotifications(data);
            } catch (error) {
                console.error('Error fetching notifications:', error);
                setNotifications([]);
            }
        };
        fetchNotifications();

        const handleNotification = (newNotification) => {
            setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, []);

    const handleClick = (id) => {
        navigate(`/teacher/notifications/${id}`);
    };

    return (
        <div className="notification-dropdown">
            {notifications.length === 0 ? (
                <div className="empty-message">No notifications</div>
            ) : (
                notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className="notification-item"
                        onClick={() => handleClick(notification.id)}
                    >
                        <div className="notification-title">
                        {notification?.title || "No Title"}
                        </div>
                        <div className="notification-snippet">
                        {notification?.content
                            ? (notification.content.length > 60
                                ? notification.content.slice(0, 60) + "..."
                                : notification.content)
                            : "No Content"}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}