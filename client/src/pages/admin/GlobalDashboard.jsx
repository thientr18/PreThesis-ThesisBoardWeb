import React, { useState, useEffect } from "react";
import api from "@/utils/axios";

export default function GlobalDashboard() {
    
    return (
        <div className="dashboard-container">
        {/* Semester Box */}
        <div className="semester-box">
            <span className="label">Semester:</span>
            <span className="value">{semesterName}</span>
        </div>
    
        {/* Dashboard Cards */}
        <div className="dashboard-cards">
            <div className="card">
            <h3>Total Students</h3>
            <p>{data.totalStudents}</p>
            </div>
            <div className="card">
            <h3>Total Teachers</h3>
            <p>{data.totalTeachers}</p>
            </div>
            <div className="card">
            <h3>Total Pre-Thesis</h3>
            <p>{data.totalPreThesis}</p>
            </div>
            <div className="card">
            <h3>Total Thesis</h3>
            <p>{data.totalThesis}</p>
            </div>
        </div>
        </div>
    );
}