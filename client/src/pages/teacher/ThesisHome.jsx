import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTeacher } from "@/contexts/TeacherContext";
import api from "@/utils/axios";

const ThesisHome = () => {
    const { thesisId } = useParams();
    const { teacher, semesters, loading } = useTeacher();
    const [thesis, setThesis] = useState(null);
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [existingGrade, setExistingGrade] = useState(null);
    const [gradingLoading, setGradingLoading] = useState(false);
    const [submittingGrade, setSubmittingGrade] = useState(false);
    const [semesterInfo, setSemesterInfo] = useState(null);
    const [canGrade, setCanGrade] = useState(false);

    useEffect(() => {
        const fetchThesis = async () => {
            try {
                const response = await api.get(`/teacher/thesis/${thesisId}`);
                setThesis(response.data.thesis);
                console.log("Fetched thesis data:", response.data.thesis.videoUrl);
                setStudent(response.data.thesis.student);
            } catch (error) {
                console.error("Error fetching thesis:", error);
            }
        };

        if (teacher) {
            fetchThesis();
        }
    }, [teacher]);

    useEffect(() => {
        if (thesis) {
            fetchExistingGrade();
        }
    }, [thesis]);

    const fetchExistingGrade = async () => {
        try {
            setGradingLoading(true);
            const response = await api.get(`/teacher/thesis/${thesisId}/grade`);
            if (response.data.grade) {
                setExistingGrade(response.data.grade);
                setGrade(response.data.grade.value);
                setFeedback(response.data.grade.feedback || '');
            } else {
                setExistingGrade(null);
                setGrade('');
                setFeedback('');
            }

            // Set semester info and grading permission
            if (response.data.semester) {
                setSemesterInfo(response.data.semester);
                setCanGrade(response.data.canGrade);
            }
        } catch (error) {
            console.error("Error fetching existing grade:", error);
        } finally {
            setGradingLoading(false);
        }
    };

    const handleGradeSubmit = async (e) => {
        e.preventDefault();

        if (!grade) {
            alert("Please enter a valid grade.");
            return;
        }
        const gradeValue = parseFloat(grade);
        if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
            alert('Grade must be a number between 0 and 100');
            return;
        }

        try {
            setSubmittingGrade(true);
            const response = await api.post(`/teacher/thesis/${thesisId}/grade`, { value: grade, feedback: feedback.trim() });

            alert("Grade submitted successfully!");
            await fetchExistingGrade(); // Refresh the grade data

            const thesisResponse = await api.get(`/teacher/thesis/${thesisId}`);
            setThesis(thesisResponse.data.thesis);
        } catch (error) {
            console.error("Error submitting grade:", error);
            alert("An error occurred while submitting the grade. Please try again later.");
        } finally {
            setSubmittingGrade(false);
        }
    }

    const getFileName = (filePath) => {
        if (!filePath) return null;
        
        const fileName = filePath.split('/').pop();
        
        // Pattern: thesis-{timestamp}-{originalName}.{extension}
        const match = fileName.match(/^thesis-.*?-\d+-(.*\..+)$/) || 
                     fileName.match(/^thesis-\d+-\d+-(.*\..+)$/);
        
        if (match) {
            return match[1]; // Returns originalName.extension
        }
        return fileName;
    };

    const handleDownload = async (filePath, type) => {
        try {
            console.log(`Downloading ${type} file from path:`, filePath);
            
            // Extract just the filename from the full path
            const fileName = filePath.split('/').pop();
            
            // Use thesis-specific download endpoint
            const response = await api.get(`/teacher/thesis/files/download/${fileName}`, {
                responseType: 'blob'
            });
            
            // Get the original filename for download
            const originalFileName = getFileName(filePath) || fileName;
            
            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', originalFileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(`Error downloading ${type}:`, error);
            alert(`Failed to download ${type}. Please contact support if the problem persists.`);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'pending': { color: '#ffc107', text: 'IN PROGRESS', bg: '#fff3cd' },
            'submitted': { color: '#17a2b8', text: 'SUBMITTED', bg: '#d1ecf1' },
            'approved': { color: '#28a745', text: 'APPROVED', bg: '#d4edda' },
            'failed': { color: '#dc3545', text: 'FAILED', bg: '#f8d7da' },
            'completed': { color: '#6f42c1', text: 'COMPLETED', bg: '#e2d9f3' }
        };
        
        const config = statusConfig[status] || { color: '#6c757d', text: status?.toUpperCase() || 'UNKNOWN', bg: '#e2e3e5' };
        
        return (
            <span 
                style={{ 
                    color: config.color, 
                    fontWeight: 'bold',
                    padding: '4px 12px',
                    backgroundColor: config.bg,
                    borderRadius: '4px',
                    border: `1px solid ${config.color}`,
                    fontSize: '12px',
                    letterSpacing: '0.5px'
                }}
            >
                {config.text}
            </span>
        );
    };

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        
        // Handle different YouTube URL formats
        const regexPatterns = [
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
            /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/
        ];
        
        for (const pattern of regexPatterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1&playsinline=1`;
            }
        }
        
        return null;
    };

    const getGradeStatus = (gradeValue) => {
        if (gradeValue >= 50) {
            return { status: 'PASSED', color: '#28a745', icon: '✓' };
        } else {
            return { status: 'FAILED', color: '#dc3545', icon: '✗' };
        }
    }

    const getDeadlineInfo = () => {
        if (!semesterInfo || !semesterInfo.deadlines) return null;

        const endDate = new Date(semesterInfo.endDate);
        const currentDate = new Date();
        const isExpired = currentDate > endDate;

        return {
            endDate,
            isExpired,
            daysRemaining: Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24))
        }
    }

    const getDeadlineWarning = () => {
        const deadlineInfo = getDeadlineInfo();
        if (!deadlineInfo) return null;
        
        if (deadlineInfo.isExpired) {
            return {
                message: `Grading period ended on ${deadlineInfo.endDate.toLocaleDateString()}`,
                color: '#dc3545',
                backgroundColor: '#f8d7da',
                borderColor: '#f5c6cb'
            };
        } else if (deadlineInfo.daysRemaining <= 7) {
            return {
                message: `Grading deadline: ${deadlineInfo.endDate.toLocaleDateString()} (${deadlineInfo.daysRemaining} days remaining)`,
                color: '#856404',
                backgroundColor: '#fff3cd',
                borderColor: '#ffeaa7'
            };
        } else {
            return {
                message: `Grading deadline: ${deadlineInfo.endDate.toLocaleDateString()} (${deadlineInfo.daysRemaining} days remaining)`,
                color: '#155724',
                backgroundColor: '#d4edda',
                borderColor: '#c3e6cb'
            };
        }
    };

    if (loading) {
        return <div className="dashboard-container">Loading...</div>;
    }

    if (!thesis || !student) {
        return <div className="dashboard-container">No thesis data found.</div>;
    }

    const reportSubmissions = thesis.submissions?.filter(sub => sub.type === 'report') || [];
    const projectSubmissions = thesis.submissions?.filter(sub => sub.type === 'project') || [];
    const presentationSubmissions = thesis.submissions?.filter(sub => sub.type === 'presentation') || [];

    return (
        <div className="dashboard-container">
            <h1>Thesis Overview</h1>
            <div className="thesis-info-stack">
                {/* Student Card */}
                <div className="thesis-student-card">
                    <h2 className="thesis-card-title">Student Info</h2>
                    <table className="thesis-info-table">
                        <tbody>
                            <tr>
                                <td className="label">Full Name:</td>
                                <td className="value student-name" style={{color: "#2096f2"}}>{student.fullName}</td>
                            </tr>
                            <tr>
                                <td className="label">Student ID:</td>
                                <td className="value">{student.user?.username}</td>
                            </tr>
                            <tr>
                                <td className="label">Email:</td>
                                <td className="value" style={{textTransform: "lowercase"}}>{student.email}</td>
                            </tr>
                            <tr>
                                <td className="label">Phone:</td>
                                <td className="value">{student.phone}</td>
                            </tr>
                            <tr>
                                <td className="label">GPA:</td>
                                <td className="value">{student.gpa}</td>
                            </tr>
                            <tr>
                                <td className="label">Credits:</td>
                                <td className="value">{student.credits}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Thesis Card */}
                <div className="thesis-detail-card">
                    <h2 className="thesis-card-title">Thesis Details</h2>
                    <table className="thesis-info-table">
                        <tbody>
                            <tr>
                                <td className="label">Title:</td>
                                <td className="value thesis-title" style={{fontWeight: 700, color: "#002f65"}}>{thesis.title}</td>
                            </tr>
                            <tr>
                                <td className="label">Status:</td>
                                <td className="value">{getStatusBadge(thesis.status)}</td>
                            </tr>
                            <tr>
                                <td className="label">Description:</td>
                                <td className="value">
                                    <div>{thesis.description}</div>
                                </td>
                            </tr>
                            <tr>
                                <td className="label">Progress Report:</td>
                                <td className="value">
                                    {thesis.report ? (
                                        <span style={{ color: "#28a745" }}>✓ Submitted ({thesis.reportSubmissionCount} times)</span>
                                    ) : (
                                        <span style={{ color: "#dc3545" }}>⚠️ Not submitted</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="label">Project File:</td>
                                <td className="value">
                                    {thesis.project ? (
                                        <span style={{ color: "#28a745" }}>✓ Submitted ({thesis.projectSubmissionCount} times)</span>
                                    ) : (
                                        <span style={{ color: "#dc3545" }}>⚠️ Not submitted</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="label">Presentation:</td>
                                <td className="value">
                                    {thesis.presentation ? (
                                        <span style={{ color: "#28a745" }}>✓ Submitted ({thesis.presentationSubmissionCount} times)</span>
                                    ) : (
                                        <span style={{ color: "#dc3545" }}>⚠️ Not submitted</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="label">Demo:</td>
                                <td className="value">
                                    {thesis.videoUrl ? (
                                        <span style={{ color: "#28a745" }}>✓ Submitted</span>
                                    ) : (
                                        <span style={{ color: "#6c757d" }}>Not submitted</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="label">Created:</td>
                                <td className="value">{new Date(thesis.createdAt).toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <h1>Student Submissions</h1>
            <div className="thesis-submission-card">
                {/* Progress Report Submission Section */}
                {reportSubmissions.length > 0 && (
                    <div className="submission-section">
                        <h3 className="submission-type-title">Progress Report Submissions ({reportSubmissions.length} total)</h3>
                        
                        {/* Latest Report */}
                        {thesis.report && (
                            <div className="submission-status">
                                <div className="file-status-container">
                                    <span className="status-text">
                                        ✓ Latest Report: <span className="file-name">{getFileName(thesis.report)}</span>
                                        {thesis.reportSubmissionCount > 1 && (
                                            <span className="submission-count"> (Latest of {thesis.reportSubmissionCount} submissions)</span>
                                        )}
                                    </span>
                                    <button 
                                        className="download-btn"
                                        onClick={() => handleDownload(thesis.report, 'report')}
                                        title="Download latest report"
                                    >
                                        📄 Download Latest
                                    </button>
                                    {thesis.reportSubmittedAt && (
                                        <span className="submission-date">
                                            Latest: {new Date(thesis.reportSubmittedAt).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* All Report Submissions */}
                        {reportSubmissions.length > 1 && (
                            <div className="submission-history">
                                <h4 style={{margin: "16px 0 8px 0", color: "#666"}}>All Report Submissions:</h4>
                                <div className="submissions-list">
                                    {reportSubmissions
                                        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                                        .map((submission, index) => (
                                        <div key={submission.id} className={`submission-row ${index === 0 ? 'latest' : ''}`}>
                                            <div className="submission-details">
                                                <span className="submission-number">#{reportSubmissions.length - index}</span>
                                                <span className="file-name">{getFileName(submission.fileUrl)}</span>
                                                <span className="submission-date">
                                                    {new Date(submission.submittedAt).toLocaleString()}
                                                </span>
                                                {index === 0 && <span className="latest-badge">Latest</span>}
                                            </div>
                                            <button 
                                                className="download-btn"
                                                onClick={() => handleDownload(submission.fileUrl, 'report')}
                                                title={`Download report submission #${reportSubmissions.length - index}`}
                                            >
                                                📄 Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Project File Submission Section */}
                {projectSubmissions.length > 0 && (
                    <div className="submission-section">
                        <h3 className="submission-type-title">Project File Submissions ({projectSubmissions.length} total)</h3>
                        
                        {/* Latest Project */}
                        {thesis.project && (
                            <div className="submission-status">
                                <div className="file-status-container">
                                    <span className="status-text">
                                        ✓ Latest Project: <span className="file-name">{getFileName(thesis.project)}</span>
                                        {thesis.projectSubmissionCount > 1 && (
                                            <span className="submission-count"> (Latest of {thesis.projectSubmissionCount} submissions)</span>
                                        )}
                                    </span>
                                    <button 
                                        className="download-btn"
                                        onClick={() => handleDownload(thesis.project, 'project file')}
                                        title="Download latest project file"
                                    >
                                        📁 Download Latest
                                    </button>
                                    {thesis.projectSubmittedAt && (
                                        <span className="submission-date">
                                            Latest: {new Date(thesis.projectSubmittedAt).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* All Project Submissions */}
                        {projectSubmissions.length > 1 && (
                            <div className="submission-history">
                                <h4 style={{margin: "16px 0 8px 0", color: "#666"}}>All Project File Submissions:</h4>
                                <div className="submissions-list">
                                    {projectSubmissions
                                        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                                        .map((submission, index) => (
                                        <div key={submission.id} className={`submission-row ${index === 0 ? 'latest' : ''}`}>
                                            <div className="submission-details">
                                                <span className="submission-number">#{projectSubmissions.length - index}</span>
                                                <span className="file-name">{getFileName(submission.fileUrl)}</span>
                                                <span className="submission-date">
                                                    {new Date(submission.submittedAt).toLocaleString()}
                                                </span>
                                                {index === 0 && <span className="latest-badge">Latest</span>}
                                            </div>
                                            <button 
                                                className="download-btn"
                                                onClick={() => handleDownload(submission.fileUrl, 'project file')}
                                                title={`Download project file submission #${projectSubmissions.length - index}`}
                                            >
                                                📁 Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Presentation Submission Section */}
                {presentationSubmissions.length > 0 && (
                    <div className="submission-section">
                        <h3 className="submission-type-title">Presentation Submissions ({presentationSubmissions.length} total)</h3>
                        
                        {/* Latest Presentation */}
                        {thesis.presentation && (
                            <div className="submission-status">
                                <div className="file-status-container">
                                    <span className="status-text">
                                        ✓ Latest Presentation: <span className="file-name">{getFileName(thesis.presentation)}</span>
                                        {thesis.presentationSubmissionCount > 1 && (
                                            <span className="submission-count"> (Latest of {thesis.presentationSubmissionCount} submissions)</span>
                                        )}
                                    </span>
                                    <button 
                                        className="download-btn"
                                        onClick={() => handleDownload(thesis.presentation, 'presentation')}
                                        title="Download latest presentation"
                                    >
                                        📊 Download Latest
                                    </button>
                                    {thesis.presentationSubmittedAt && (
                                        <span className="submission-date">
                                            Latest: {new Date(thesis.presentationSubmittedAt).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* All Presentation Submissions */}
                        {presentationSubmissions.length > 1 && (
                            <div className="submission-history">
                                <h4 style={{margin: "16px 0 8px 0", color: "#666"}}>All Presentation Submissions:</h4>
                                <div className="submissions-list">
                                    {presentationSubmissions
                                        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                                        .map((submission, index) => (
                                        <div key={submission.id} className={`submission-row ${index === 0 ? 'latest' : ''}`}>
                                            <div className="submission-details">
                                                <span className="submission-number">#{presentationSubmissions.length - index}</span>
                                                <span className="file-name">{getFileName(submission.fileUrl)}</span>
                                                <span className="submission-date">
                                                    {new Date(submission.submittedAt).toLocaleString()}
                                                </span>
                                                {index === 0 && <span className="latest-badge">Latest</span>}
                                            </div>
                                            <button 
                                                className="download-btn"
                                                onClick={() => handleDownload(submission.fileUrl, 'presentation')}
                                                title={`Download presentation submission #${presentationSubmissions.length - index}`}
                                            >
                                                📊 Download
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Demo URL Section */}
                {thesis.videoUrl && (
                    <div className="submission-section">
                        <h3 className="submission-type-title">Demo Submission</h3>
                        <div className="submission-status">
                            <div className="video-submission-container">
                                <span className="status-text">
                                    ✓ Demo submitted:
                                </span>
                                <a 
                                    href={thesis.videoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="video-link"
                                    title="Open demo in new tab"
                                >
                                    🎥 Open Demo
                                </a>
                            </div>
                            
                            {/* Enhanced Privacy YouTube Video */}
                            {getYouTubeEmbedUrl(thesis.videoUrl) && (
                                <div className="embedded-video-container">
                                    <h4 className="video-title">Demo Video Preview:</h4>
                                    <div className="video-wrapper">
                                        <iframe
                                            src={getYouTubeEmbedUrl(thesis.videoUrl)}
                                            title="Thesis Demo Video"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                            className="youtube-iframe"
                                            loading="lazy"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                        ></iframe>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* No Submissions Message */}
                {(!thesis.report && !thesis.project && !thesis.presentation && !thesis.videoUrl) && (
                    <div className="submission-section">
                        <div className="no-submissions">
                            <p>No submissions yet from this student.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Grading Section */}
            <h1>Grade Thesis</h1>
            <div className="grading-section">
                {gradingLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading grade information...</div>
                ) : (
                    <>
                        {/* Deadline Warning */}
                        {semesterInfo && (
                            <div className="deadline-warning" style={{
                                padding: '12px 16px',
                                marginBottom: '20px',
                                borderRadius: '4px',
                                border: `1px solid ${getDeadlineWarning()?.borderColor}`,
                                backgroundColor: getDeadlineWarning()?.backgroundColor,
                                color: getDeadlineWarning()?.color
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>
                                        {!canGrade ? '⚠️' : '📅'}
                                    </span>
                                    <span style={{ fontWeight: '600' }}>
                                        {getDeadlineWarning()?.message}
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', marginTop: '4px', opacity: '0.8' }}>
                                    Semester: {semesterInfo.name}
                                </div>
                            </div>
                        )}

                        {existingGrade && (
                            <div className="existing-grade-display">
                                <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Current Grade</h3>
                                <div className="grade-display-card">
                                    <div className="grade-score">
                                        <span className="grade-number">{existingGrade.value}</span>
                                        <span className="grade-total">/100</span>
                                        <div 
                                            className="grade-status"
                                            style={{ color: getGradeStatus(existingGrade.value).color }}
                                        >
                                            {getGradeStatus(existingGrade.value).icon} {getGradeStatus(existingGrade.value).status}
                                        </div>
                                    </div>
                                    {existingGrade.feedback && (
                                        <div className="grade-feedback-display">
                                            <strong>Feedback:</strong>
                                            <p>{existingGrade.feedback}</p>
                                        </div>
                                    )}
                                    <div className="grade-metadata">
                                        <small>
                                            Graded on: {new Date(existingGrade.updatedAt).toLocaleString()}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        )}

                        {canGrade ? (
                            <form onSubmit={handleGradeSubmit} className="grading-form">
                                <div className="form-group">
                                    <label htmlFor="grade" className="form-label">
                                        Grade (0-100) <span className="required">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        id="grade"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={grade}
                                        onChange={(e) => setGrade(e.target.value)}
                                        className="form-input"
                                        placeholder="Enter grade (0-100)"
                                        required
                                    />
                                    <small className="form-help">
                                        Minimum passing grade: 50. Grade will determine if thesis is completed or failed.
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="feedback" className="form-label">
                                        Feedback (Optional)
                                    </label>
                                    <textarea
                                        id="feedback"
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="form-textarea"
                                        rows="4"
                                        placeholder="Enter feedback and comments for the student..."
                                    />
                                </div>

                                {grade && (
                                    <div className="grade-preview">
                                        <strong>Preview: </strong>
                                        <span style={{ color: getGradeStatus(parseFloat(grade)).color }}>
                                            {grade}/100 - {getGradeStatus(parseFloat(grade)).status}
                                        </span>
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button 
                                        type="submit" 
                                        className="submit-grade-btn"
                                        disabled={submittingGrade}
                                    >
                                        {submittingGrade ? 'Submitting...' : (existingGrade ? 'Update Grade' : 'Submit Grade')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="grading-disabled-message">
                                <p>
                                    {!canGrade && semesterInfo ? 
                                        `Grading period has ended. Semester "${semesterInfo.name}" ended on ${new Date(semesterInfo.endDate).toLocaleDateString()}` :
                                        `Grading is not available for thesis with status: ${thesis.status}`
                                    }
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ThesisHome;