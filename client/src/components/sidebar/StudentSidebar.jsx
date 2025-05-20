import React, { useState, useEffect } from "react";
import { useStudent } from "@/contexts/StudentContext";

export default function StudentSidebar() {
  const { student, loading } = useStudent();

  const isRegistered = student?.isRegistered;
  const type = student?.type;

  if (loading) {
    return <div className="student-sidebar">Loading...</div>;
  }
  
  return (
    <div className="student-sidebar">
      <div className="sidebar-content">
        <div className="section">
          <div className="section-title">Applications</div>
          <div className="section-content">
            {
            <>
              {(!isRegistered && type === 'pre-thesis') && (
              <a href="/topic-list">
                <button className="sidebar-btn">
                  <img src="/student-icon.svg" alt="student icon" className="icon" />
                  <span>Topics</span>
                </button>
              </a>
              )}
              {(isRegistered && type === 'pre-thesis') && (
                <a href="/pre-thesis">
                  <button className="sidebar-btn">
                    <img src="/student-icon.svg" alt="student icon" className="icon" />
                    <span>Your Pre-Thesis</span>
                  </button>
                </a>
              )}
              {(!isRegistered && type === 'thesis') && (
              <a href="/contact-supervisor">
                <button className="sidebar-btn">
                  <img src="/student-icon.svg" alt="student icon" className="icon" />
                  <span>Contact Supervisor</span>
                </button>
              </a>
              )}
              {(isRegistered && type === 'thesis') && (
                <a href="/thesis">
                  <button className="sidebar-btn">
                    <img src="/student-icon.svg" alt="student icon" className="icon" />
                    <span>Your Thesis</span>
                  </button>
                </a>
              )}
            </>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
