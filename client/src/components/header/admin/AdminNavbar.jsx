import React, { useState, useRef, useEffect } from "react";
import AccountDropdown from "./AccountDropdown";
import NotificationDropdown from "./NotificationDropdown";
import api from "@/utils/axios";

export default function AdminNavbar({ toggleSidebar }) {
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const accountRef = useRef(null);
  const notificationRef = useRef(null);

  // Fetch notifications on mount
  useEffect(() => {
      const fetchNotifications = async () => {
          try {
              const response = await api.get('/admin/notifications');
              setNotifications(response.data.notifications); // Access nested notifications
              setUnreadCount(response.data.unreadCount); // Access nested unreadCount
          } catch (error) {
              setNotifications([]);
              setUnreadCount(0);
          }
      };
      fetchNotifications();
  }, []);
  
  const toggleAccountDropdown = () => {
    setShowAccountDropdown(prev => !prev);
    setShowNotificationDropdown(false); // close other dropdown
  };

  const toggleNotificationDropdown = () => {
    setShowNotificationDropdown(prev => !prev);
    setShowAccountDropdown(false); // close other dropdown
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accountRef.current && !accountRef.current.contains(event.target)
      ) {
        setShowAccountDropdown(false);
      }
      if (
        notificationRef.current && !notificationRef.current.contains(event.target)
      ) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedNotifications = [...notifications].sort((a, b) => {
      if (a.isRead === b.isRead) return 0;
      return a.isRead ? 1 : -1;
  });

  return (
    <div className="navbar-container">
      <div className="nav-left">
        <img
          className="img sidebar-btn pointer"
          alt="Sidebar btn"
          src="/sidebar.svg"
          onClick={toggleSidebar}
        />
        <a className="logo-wrapper" href="/admin">
          <img className="img" alt="Logo" src="/hat-logo.svg" />
          <div className="text">ThesisBoard</div>
        </a>
      </div>

      <div className="nav-right">
        <div ref={notificationRef} style={{ position: "relative" }}>
          <img
            className="notification-btn pointer"
            alt="Notification btn"
            src="/ring.svg"
            onClick={toggleNotificationDropdown}
          />
          {unreadCount > 0 && (
              <span
                  style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      background: "red",
                      color: "white",
                      borderRadius: "50%",
                      padding: "2px 7px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      zIndex: 1
                  }}
              >
                  {unreadCount}
              </span>
          )}
          {showNotificationDropdown && (
              <NotificationDropdown 
                  notifications = {sortedNotifications}
                  setNotifications={setNotifications}
                  setUnreadCount={setUnreadCount}     
              />
          )}
        </div>

        <div className="user-wrap" onClick={toggleAccountDropdown} ref={accountRef}>
          <img className="user-avatar pointer" alt="User avatar" src="/user-avatar.svg" />
          <img
            className="drop-down pointer"
            alt="Drop down"
            src={showAccountDropdown ? "/caret-up.svg" : "/caret-down.svg"}
          />
          {showAccountDropdown && <AccountDropdown />}
        </div>
      </div>
    </div>
  );
}
