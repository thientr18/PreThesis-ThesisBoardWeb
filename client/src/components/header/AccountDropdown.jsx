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
      <a className="dropdown-item" href="/admin/profile">
        <img className="icon" src="/profile.svg" alt="Profile" />
        <span className="label">Profile</span>
      </a>

      <a className="dropdown-item" href="/admin/change-password">
        <img className="icon" src="/change-password.svg" alt="Change Password" />
        <span className="label">Change Password</span>
      </a>

      <a className="dropdown-item" href="/admin/system-settings">
        <img className="icon" src="/system-settings.svg" alt="System Settings" />
        <span className="label">System Settings</span>
      </a>

      <a className="dropdown-item" href="/admin/all-reports">
        <img className="icon" src="/all-reports.svg" alt="All Reports" />
        <span className="label">All Reports</span>
      </a>

      <a className="dropdown-item" href="/admin/audit-logs">
        <img className="icon" src="/audit-logs.svg" alt="Audit Logs" />
        <span className="label">Audit Logs</span>
      </a>

      <button className="dropdown-item" onClick={handleLogout}>
        <img className="icon" src="/logout.svg" alt="Logout" />
        <span className="label">Logout</span>
      </button>
    </div>
  );
}