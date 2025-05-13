import React, { useState } from "react";

export default function AdminSidebar() {
  // Manage the toggle state for each section
  const [studentOpen, setStudentOpen] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [moderatorOpen, setModeratorOpen] = useState(false);

  const [globalOpen, setGlobalOpen] = useState(false);

  // Toggle functions for Applications
  const toggleStudent = () => setStudentOpen((prev) => !prev);
  const toggleTeacher = () => setTeacherOpen((prev) => !prev);
  const toggleModerator = () => setModeratorOpen((prev) => !prev);

  // Toggle functions for Announcements
  const toggleGlobal = () => setGlobalOpen((prev) => !prev);

  return (
    <div className="admin-sidebar">
      <div className="sidebar-content">
        <div className="section">
          <div className="section-title">Applications</div>
          
          <button className="sidebar-btn" onClick={toggleStudent}>
            <img src="/student-icon.svg" alt="student icon" className="icon" />
            <span>Student</span>
            <img
              src={studentOpen ? "/caret-up.svg" : "/caret-down.svg"}
              alt="caret"
              className="caret"
            />
          </button>
          {studentOpen && (
            <div className="sub-buttons">
              <a href="/admin/student/dashboard">
                <button className="sidebar-btn">
                  <span>Student Dashboard</span>
                </button>
              </a>
              <a href="/admin/student/config">
                <button className="sidebar-btn">
                  <span>Student Config</span>
                </button>
              </a>
            </div>
          )}

          <button className="sidebar-btn" onClick={toggleTeacher}>
            <img src="/teacher.svg" alt="teacher icon" className="icon" />
            <span>Teacher</span>
            <img
              src={teacherOpen ? "/caret-up.svg" : "/caret-down.svg"}
              alt="caret"
              className="caret"
            />
          </button>
          {teacherOpen && (
            <div className="sub-buttons">
              <a href="/admin/teacher/dashboard">
                <button className="sidebar-btn">
                  <span>Teacher Dashboard</span>
                </button>
              </a>
              <a href="/admin/teacher/config">
                <button className="sidebar-btn">
                  <span>Teacher Config</span>
                </button>
              </a>
            </div>
          )}

          <button className="sidebar-btn" onClick={toggleModerator}>
            <img src="/moderator.svg" alt="moderator icon" className="icon" />
            <span>Moderator</span>
            <img
              src={moderatorOpen ? "/caret-up.svg" : "/caret-down.svg"}
              alt="caret"
              className="caret"
            />
          </button>
          {moderatorOpen && (
            <div className="sub-buttons">
              <a href="/admin/moderator/dashboard">
                <button className="sidebar-btn">
                  <span>Moderator Dashboard</span>
                </button>
              </a>
              <a href="/admin/moderator/config">
                <button className="sidebar-btn">
                  <span>Moderator Config</span>
                </button>
              </a>
            </div>
          )}
        </div>

        <div className="section">
          <div className="section-title">Announcements</div>
          
          <button className="sidebar-btn" onClick={toggleGlobal}>
            <img src="/global.svg" alt="global icon" className="icon" />
            <span>Global</span>
            <img
              src={globalOpen ? "/caret-up.svg" : "/caret-down.svg"}
              alt="caret"
              className="caret"
            />
          </button>
          {globalOpen && (
            <div className="sub-buttons">
              <a href="/admin/announcements/dahsboard">
                <button className="sidebar-btn">
                  <span>Global Dashboard</span>
                </button>
              </a>
              <a href="/admin/announcements/config">
                <button className="sidebar-btn">
                  <span>Global Config</span>
                </button>
              </a>
            </div>
          )}

          <a href="/admin/announcements/students">
            <button className="sidebar-btn">
              <img src="/student-icon.svg" alt="student icon" className="icon" />
              <span>Student</span>
            </button>
          </a>

          <a href="/admin/announcements/teachers">
            <button className="sidebar-btn">
              <img src="/teacher.svg" alt="teacher icon" className="icon" />
              <span>Teacher</span>
            </button>
          </a>

          <a href="/admin/announcements/moderators">
            <button className="sidebar-btn">
              <img src="/moderator.svg" alt="moderator icon" className="icon" />
              <span>Moderator</span>
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
