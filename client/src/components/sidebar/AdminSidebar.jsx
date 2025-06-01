import React, { useState } from "react";

export default function AdminSidebar() {
  const [teacherOpen, setTeacherOpen] = useState(false);
  const toggleTeacher = () => setTeacherOpen((prev) => !prev);

  return (
    <div className="admin-sidebar">
      <div className="sidebar-content">
        <div className="section">
          <div className="section-title">Applications</div>

          <a href="/admin/student/config">
            <button className="sidebar-btn">
              <img src="/student-icon.svg" alt="student icon" className="icon" />
              <span>Student</span>
            </button>
          </a>

          {/* Make Teacher expandable */}
          <div>
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
                <a href="/admin/teacher/config">
                  <button className="sidebar-btn submenu-btn">
                    <span>Teacher Config</span>
                  </button>
                </a>
                <a href="/admin/teacher/semester-assignment">
                  <button className="sidebar-btn submenu-btn">
                    <span>Semester Assignment</span>
                  </button>
                </a>
              </div>
            )}
          </div>

          <a href="/admin/moderator/config">
            <button className="sidebar-btn">
              <img src="/moderator.svg" alt="moderator icon" className="icon" />
              <span>Moderator</span>
            </button>
          </a>
        </div>

        <div className="section">
          <div className="section-title">System Settings</div>
          <a href="/admin/announcements/">
            <button className="sidebar-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" style={{fill: '#2096F2'}} viewBox="0 0 512 512" className="icon">
                    <path d="M480 32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9L381.7 53c-48 48-113.1 75-181 75l-8.7 0-32 0-96 0c-35.3 0-64 28.7-64 64l0 96c0 35.3 28.7 64 64 64l0 128c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32l0-128 8.7 0c67.9 0 133 27 181 75l43.6 43.6c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6l0-147.6c18.6-8.8 32-32.5 32-60.4s-13.4-51.6-32-60.4L480 32zm-64 76.7L416 240l0 131.3C357.2 317.8 280.5 288 200.7 288l-8.7 0 0-96 8.7 0c79.8 0 156.5-29.8 215.3-83.3z"/>
                  </svg>
              <span>Announcements</span>
            </button>
          </a>
          <a href="/admin/configurations/">
            <button className="sidebar-btn">
              <svg xmlns="http://www.w3.org/2000/svg" style={{fill: '#2096F2'}} className="icon" viewBox="0 0 512 512">
                <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/>
              </svg>
              <span>Configurations</span>
            </button>
          </a>
          <a href="/admin/all-reports">
            <button className="sidebar-btn">
              <svg xmlns="http://www.w3.org/2000/svg" style={{fill: '#2096F2'}} className="icon" viewBox="0 0 576 512">
                <path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 128-168 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l168 0 0 112c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64zM384 336l0-48 110.1 0-39-39c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l80 80c9.4 9.4 9.4 24.6 0 33.9l-80 80c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l39-39L384 336zm0-208l-128 0L256 0 384 128z"/>
              </svg>
              <span>All Reports</span>
            </button>
          </a>
          <a href="/admin/dashboard">
            <button className="sidebar-btn">
              <img src="/dashboard.svg" alt="dashboard icon" className="icon" />
              <span>Dashboard</span>
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
