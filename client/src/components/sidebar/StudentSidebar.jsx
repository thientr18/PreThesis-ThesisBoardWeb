import React from "react";
import { useStudent } from "@/contexts/StudentContext";

export default function StudentSidebar() {
  const { student, semesters, loading } = useStudent();
  if (loading) {
    return <div className="student-sidebar">Loading...</div>;
  }
  
  const sortedSemesters = [...semesters].sort(
    (a, b) => new Date(b.semester.startDate) - new Date(a.semester.startDate)
  );

  return (
    <div className="student-sidebar">
      <div className="sidebar-content">
        {sortedSemesters && sortedSemesters.length > 0 ? (
          sortedSemesters.map((sem, idx) => (
            <div className="section" key={sem.semesterId || idx}>
              <div className="section-title">{sem.semester.name}</div>
              <div className="section-content">
                <>
                  {(!sem.isRegistered && sem.type === 'pre-thesis') && (
                    <a href="/topic-list">
                      <button className="sidebar-btn">
                        <img src="/student-icon.svg" alt="student icon" className="icon" />
                        <span>Topics</span>
                      </button>
                    </a>
                  )}
                  {(sem.isRegistered && sem.type === 'pre-thesis') && (
                    <a href={`/pre-thesis/${sem.semesterId}`}>
                      <button className="sidebar-btn">
                        <img src="/student-icon.svg" alt="student icon" className="icon" />
                        <span>Your Pre-Thesis</span>
                      </button>
                    </a>
                  )}
                  {(!sem.isRegistered && sem.type === 'thesis') && (
                    <a href="/contact-supervisor">
                      <button className="sidebar-btn">
                        <img src="/student-icon.svg" alt="student icon" className="icon" />
                        <span>Contact Supervisor</span>
                      </button>
                    </a>
                  )}
                  {(sem.isRegistered && sem.type === 'thesis') && (
                    <a href={`/thesis/${sem.semesterId}`}>
                      <button className="sidebar-btn">
                        <img src="/student-icon.svg" alt="student icon" className="icon" />
                        <span>Your Thesis</span>
                      </button>
                    </a>
                  )}
                </>
              </div>
            </div>
          ))
        ) : (
          <div>No semester data available.</div>
        )}
        
        <div className="section">
          <div className="section-title"></div>
          <div className="section-content">
            <a href="/announcements">
                <button className="sidebar-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" style={{fill: '#2096F2'}} viewBox="0 0 512 512" className="icon">
                        <path d="M480 32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9L381.7 53c-48 48-113.1 75-181 75l-8.7 0-32 0-96 0c-35.3 0-64 28.7-64 64l0 96c0 35.3 28.7 64 64 64l0 128c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32l0-128 8.7 0c67.9 0 133 27 181 75l43.6 43.6c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6l0-147.6c18.6-8.8 32-32.5 32-60.4s-13.4-51.6-32-60.4L480 32zm-64 76.7L416 240l0 131.3C357.2 317.8 280.5 288 200.7 288l-8.7 0 0-96 8.7 0c79.8 0 156.5-29.8 215.3-83.3z"/>
                    </svg>
                    <span>Announcements</span>
                </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}