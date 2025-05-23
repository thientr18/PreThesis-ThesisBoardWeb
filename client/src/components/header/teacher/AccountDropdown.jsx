import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";

export default function AccountDropdown() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="account-dropdown">
      <a className="dropdown-item" href="/teacher/profile">
        <img className="icon" src="/profile.svg" alt="Profile" />
        <span className="label">Profile</span>
      </a>

      <a className="dropdown-item" href="/teacher/change-password">
        <img className="icon" src="/change-password.svg" alt="Change Password" />
        <span className="label">Change Password</span>
      </a>
      
      <button className="dropdown-item" onClick={handleLogout}>
        <img className="icon" src="/logout.svg" alt="Logout" />
        <span className="label">Logout</span>
      </button>
    </div>
  );
}