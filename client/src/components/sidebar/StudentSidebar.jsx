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
                    <a href="/pre-thesis">
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
                    <a href="/thesis">
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
      </div>
    </div>
  );
}