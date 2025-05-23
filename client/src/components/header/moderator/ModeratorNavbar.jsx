import React, { useState, useRef, useEffect } from "react";
import AccountDropdown from "./AccountDropdown";
import NotificationDropdown from "./NotificationDropdown";

export default function ModeratorNavbar({ toggleSidebar }) {
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

    const accountRef = useRef(null);
    const notificationRef = useRef(null);

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

    return (
        <div className="navbar-container">
        <div className="nav-left">
            <img
                className="img sidebar-btn pointer"
                alt="Sidebar btn"
                src="/sidebar.svg"
                onClick={toggleSidebar}
            />
            <a className="logo-wrapper" href="/moderator">
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
            {showNotificationDropdown && (
                <NotificationDropdown />
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