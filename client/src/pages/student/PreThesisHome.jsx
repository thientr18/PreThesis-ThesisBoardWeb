import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useStudent } from "@/contexts/StudentContext";
import api from "@/utils/axios";
import { formatDateToVietnam, isDeadlinePassed } from "@/utils/dateUtils";

const PreThesisHome = () => {
    const { semesterId } = useParams();
    const { student, loading } = useStudent();
    const [preThesis, setPreThesis] = useState({
        id: null,
        title: '',
        description: '',
        status: '',
        report: null,
        videoUrl: null,
        grade: null,
        feedback: null,
        gradedAt: null,
        submissionDeadline: null,
        isSubmissionAllowed: true,
        preThesisTopic: {
            supervisor: {
                fullName: '',
                email: '',
                phone: ''
            }
        }
    });
    const [topic, setTopic] = useState(null);
    const [teacher, setTeacher] = useState({
        fullName: '',
        email: '',
        phone: ''
    });
    const [uploading, setUploading] = useState(false);
    const [uploadType, setUploadType] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [dataLoaded, setDataLoaded] = useState(false);

    const fetchPreThesis = async () => {
        try {
            const response = await api.get(`/student/pre-thesis/${semesterId}`);
            const data = response.data.preThesis;
            setPreThesis({
                ...data,
                title: data.title || '',
                description: data.description || '',
                status: data.status || '',
                report: data.report || null,
                project: data.project || null,
                videoUrl: data.videoUrl || null,
                grade: data.grade || null,
                feedback: data.feedback || null,
                gradedAt: data.gradedAt || null,
                submissionDeadline: data.submissionDeadline || null,
                isSubmissionAllowed: data.isSubmissionAllowed !== false,
            });

            setTopic(response.data.preThesis.preThesisTopic || null);
            
            const supervisor = data.preThesisTopic?.supervisor;
            setTeacher({
                fullName: supervisor?.fullName || '',
                email: supervisor?.email || '',
                phone: supervisor?.phone || ''
            });

            setDataLoaded(true);
        } catch (error) {
            console.error("Error fetching pre-thesis data:", error);
        }
    };

    useEffect(() => {
        if (semesterId) {
            fetchPreThesis();
        }
    }, [semesterId]);

    const getGradeDisplay = (grade) => {
        if (grade === null || grade === undefined) {
            return { text: 'Not graded yet', color: '#6c757d', icon: '⏳' };
        }
        
        const numericGrade = parseFloat(grade);
        if (numericGrade >= 85) {
            return { text: `${grade}/100 (Excellent)`, color: '#28a745', icon: '🏆' };
        } else if (numericGrade >= 70) {
            return { text: `${grade}/100 (Good)`, color: '#17a2b8', icon: '👍' };
        } else if (numericGrade >= 60) {
            return { text: `${grade}/100 (Satisfactory)`, color: '#ffc107', icon: '✓' };
        } else if (numericGrade >= 50) {
            return { text: `${grade}/100 (Pass)`, color: '#fd7e14', icon: '📝' };
        } else {
            return { text: `${grade}/100 (Fail)`, color: '#dc3545', icon: '❌' };
        }
    };

    const getFileName = (filePath) => {
        if (!filePath) return null;
        
        const fileName = filePath.split('/').pop();
        
        // Pattern: prethesis-{timestamp}-{originalName}.{extension}
        const match = fileName.match(/^prethesis-\d+-\d+-(.*\..+)$/);
        
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
            
            const response = await api.get(`/student/pre-thesis/files/download/${fileName}`, {
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
            alert(`Failed to download ${type}.`);
        }
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
                // Use youtube-nocookie.com for privacy-enhanced mode
                return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1&playsinline=1`;
            }
        }
        
        return null;
    };

    const handleReportSubmission = async (e) => {
        e.preventDefault();
        
        if (!preThesis.isSubmissionAllowed) {
            alert('Submission deadline has passed');
            return;
        }
        
        if (!preThesis.id) {
            alert('Pre-thesis ID not found');
            return;
        }

        const fileInput = document.getElementById('report-file');
        const file = fileInput?.files[0];

        if (!file) {
            alert('Please select a report file');
            return;
        }

        // Validate file
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            alert('Report file size must be less than 10MB');
            return;
        }

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!['.pdf', '.doc', '.docx'].includes(fileExtension)) {
            alert('Invalid report file type. Allowed: .pdf, .doc, .docx');
            return;
        }

        setUploading(true);
        setUploadType('report');

        try {
            console.log('Submitting report to pre-thesis ID:', preThesis.id);
            console.log('Report file:', file);

            const formData = new FormData();
            formData.append('report', file);

            const response = await api.post(
                `/student/pre-thesis/${preThesis.id}/submit-report`,
                formData,
            );

            console.log('Report submission response:', response.data);
            alert('Report file uploaded successfully!');
            
            // Refresh data to get updated submissions
            await fetchPreThesis();
            
            // Clear file input
            fileInput.value = '';

        } catch (error) {
            console.error('Error uploading report:', error);
            alert(error.response?.data?.message || 'Failed to upload report');
        } finally {
            setUploading(false);
            setUploadType('');
        }
    };

    const handleProjectSubmission = async (e) => {
        e.preventDefault();
        
        if (!preThesis.isSubmissionAllowed) {
            alert('Submission deadline has passed');
            return;
        }
        
        if (!preThesis.id) {
            alert('Pre-thesis ID not found');
            return;
        }

        const fileInput = document.getElementById('project-file');
        const file = fileInput?.files[0];

        if (!file) {
            alert('Please select a project file');
            return;
        }

        // Validate file
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            alert('Project file size must be less than 50MB');
            return;
        }

        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!['.zip', '.rar'].includes(fileExtension)) {
            alert('Invalid project file type. Allowed: .zip, .rar');
            return;
        }

        setUploading(true);
        setUploadType('project');

        try {
            console.log('Submitting project to pre-thesis ID:', preThesis.id);
            console.log('Project file:', file);

            const formData = new FormData();
            formData.append('project', file);

            const response = await api.post(
                `/student/pre-thesis/${preThesis.id}/submit-project`,
                formData,
            );

            console.log('Project submission response:', response.data);
            alert('Project file uploaded successfully!');

            // Refresh data to get updated submissions
            await fetchPreThesis();
            
            // Clear file input
            fileInput.value = '';

        } catch (error) {
            console.error('Error uploading project:', error);
            alert(error.response?.data?.message || 'Failed to upload project');
        } finally {
            setUploading(false);
            setUploadType('');
        }
    };

    const handleVideoSubmission = async (e) => {
        e.preventDefault();
        
        if (!preThesis.isSubmissionAllowed) {
            alert('Submission deadline has passed');
            return;
        }
        
        if (!preThesis.id) {
            alert('Pre-thesis ID not found');
            return;
        }

        if (!videoUrl.trim()) {
            alert('Please enter a video URL');
            return;
        }

        // Validate YouTube URL
        const youtubePattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/).+$/i;
        if (!youtubePattern.test(videoUrl.trim())) {
            alert('Please enter a valid YouTube URL');
            return;
        }

        setUploading(true);
        setUploadType('video');

        try {
            console.log('Submitting video URL to pre-thesis ID:', preThesis.id);
            console.log('Video URL:', videoUrl);

            const response = await api.post(
                `/student/pre-thesis/${preThesis.id}/submit-video`,
                { videoUrl: videoUrl.trim() },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Video submission response:', response.data);
            alert('Video URL submitted successfully!');

            // Update local state
            setPreThesis(prev => ({
                ...prev,
                videoUrl: response.data.videoUrl
            }));
            setVideoUrl('');

        } catch (error) {
            console.error('Error submitting video URL:', error);
            alert(error.response?.data?.message || 'Failed to submit video URL');
        } finally {
            setUploading(false);
            setUploadType('');
        }
    };

    if (loading) {
        return <div className="prethesis-home">Loading...</div>;
    }

    if (!preThesis) {
        return <div className="prethesis-home">No pre-thesis data available.</div>;
    }

    return (
        <div className="dashboard-container">
            <h1>General Information</h1>
            <div className="prethesis-info-stack">
                <div className="prethesis-student-card">
                    <h2 className="prethesis-card-title">Teacher Info</h2>
                    <table className="prethesis-info-table">
                        <tbody>
                            <tr>
                                <td className="table-label">Full Name:</td>
                                <td className="table-value" style={{ color: "#2096f2" }}>{teacher.fullName}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Email:</td>
                                <td className="table-value" style={{ textTransform: "lowercase" }}>{teacher.email}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Phone:</td>
                                <td className="table-value">{teacher.phone}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="prethesis-detail-card">
                    <h2 className="prethesis-card-title">Pre-Thesis Details</h2>
                    <table className="prethesis-info-table">
                        <tbody>
                            <tr>
                                <td className="table-label">Title:</td>
                                <td className="table-value">{preThesis.title}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Description:</td>
                                <td className="table-value">{preThesis.description}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Status:</td>
                                <td className="table-value">{preThesis.status}</td>
                            </tr>
                            <tr>
                                <td className="table-label">Report (Required):</td>
                                <td className="table-value">
                                    {preThesis.report ? (
                                        <span style={{ color: "#28a745" }}>✓ Submitted</span>
                                    ) : (
                                        <span style={{ color: "#dc3545" }}>⚠️ Not submitted</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="table-label">Project File (Required):</td>
                                <td className="table-value">
                                    {preThesis.project ? (
                                        <span style={{ color: "#28a745" }}>✓ Submitted</span>
                                    ) : (
                                        <span style={{ color: "#dc3545" }}>⚠️ Not submitted</span>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td className="table-label">Video (Optional):</td>
                                <td className="table-value">
                                    {preThesis.videoUrl ? (
                                        <span style={{ color: "#28a745" }}>✓ Submitted</span>
                                    ) : (
                                        <span style={{ color: "#6c757d" }}>Not submitted</span>
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Grade Section */}
            <h1>Grade & Feedback</h1>
            <div className="prethesis-grade-card">
                <h2 className="prethesis-card-title">Pre-Thesis Evaluation</h2>
                <div className="grade-info-container">
                    <div className="grade-display">
                        <div className="grade-header">
                            <h3>Final Grade</h3>
                        </div>
                        <div className="grade-value-container">
                            <span 
                                className="grade-value" 
                                style={{ color: getGradeDisplay(preThesis.grade).color }}
                            >
                                {getGradeDisplay(preThesis.grade).icon} {getGradeDisplay(preThesis.grade).text}
                            </span>
                            {preThesis.gradedAt && (
                                <small className="grade-date">
                                    Graded on: {formatDateToVietnam(preThesis.gradedAt)}
                                </small>
                            )}
                        </div>
                    </div>
                    
                    {preThesis.feedback ? (
                        <div className="feedback-section">
                            <h4 className="feedback-title">Supervisor's Feedback</h4>
                            <div className="feedback-content">
                                <p>{preThesis.feedback}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="no-feedback-message">
                            <p>No feedback available from the supervisor.</p>
                        </div>
                    )}

                    {!preThesis.grade && (
                        <div className="no-grade-message">
                            <div className="info-box">
                                <h4>📋 Grading Status</h4>
                                <p>Your pre-thesis is currently being evaluated by your supervisor. You will be notified once grading is complete.</p>
                                <ul>
                                    <li>Make sure you have submitted all required materials</li>
                                    <li>Contact your supervisor if you have any questions</li>
                                    <li>Check back regularly for updates</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <h1>Submission</h1>
            <div className="prethesis-submission-card">
                {/* Deadline Information */}
                {preThesis.submissionDeadline && (
                    <div className={`deadline-info ${!preThesis.isSubmissionAllowed ? 'deadline-passed' : ''}`}>
                        <h4>📅 Submission Deadline</h4>
                        <p>
                            <strong>Deadline: </strong>
                            {formatDateToVietnam(preThesis.submissionDeadline)} (Vietnam Time)
                        </p>
                        {!preThesis.isSubmissionAllowed && (
                            <div className="deadline-warning">
                                <p><strong>⚠️ SUBMISSION DEADLINE HAS PASSED</strong></p>
                                <p>You can no longer submit or modify your pre-thesis materials.</p>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Submission Guidelines */}
                <div className="submission-guidelines">
                    <h4>Submission Guidelines:</h4>
                    <ul>
                        <li><strong>MANDATORY:</strong> Report must be submitted in PDF format (max 10MB)</li>
                        <li><strong>MANDATORY:</strong> Project file must be submitted as compressed files (ZIP, RAR) (max 50MB)</li>
                        <li><strong>OPTIONAL:</strong> Demo video must be a YouTube URL only</li>
                        <li><strong style={{color: "#dc3545"}}>⚠️ WARNING: You will receive ZERO marks for pre-thesis if you don't submit both Report AND Project file before the deadline</strong></li>
                        <li>You can resubmit files multiple times until the deadline</li>
                        <li>Contact your supervisor if you encounter any issues</li>
                    </ul>
                </div>
                
                {/* Report Submission */}
                <div className="submission-section">
                    <h3 className="submission-type-title">Report Submission</h3>
                    <form onSubmit={handleReportSubmission} className="submission-form">
                        <div className="file-input-row">
                            <div className="file-input-group">
                                <label htmlFor="report-file" className="file-label">
                                    Choose Report File (PDF):
                                </label>
                                <input
                                    type="file"
                                    id="report-file"
                                    name="file"
                                    accept=".pdf"
                                    className="file-input"
                                    disabled={uploading && uploadType === 'report'}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`submit-btn ${preThesis.report ? 'resubmit' : 'initial'}`}
                                disabled={uploading && uploadType === 'report'}
                            >
                                {uploading && uploadType === 'report' ? (
                                    <span>
                                        <span className="spinner"></span>
                                        Uploading...
                                    </span>
                                ) : (
                                    preThesis.report ? 'Resubmit Report' : 'Submit Report'
                                )}
                            </button>
                        </div>
                    </form>
                    {preThesis.report && (
                        <div className="submission-status">
                            <div className="file-status-container">
                                <span className="status-text">
                                    ✓ Report submitted: <span className="file-name">{getFileName(preThesis.report)}</span>
                                    {preThesis.reportSubmissionCount > 1 && (
                                        <span className="submission-count"> (Latest of {preThesis.reportSubmissionCount} submissions)</span>
                                    )}
                                </span>
                                <button 
                                    className="download-btn"
                                    onClick={() => handleDownload(preThesis.report, 'report')}
                                    title="Download latest report file"
                                >
                                    📄 Download Report
                                </button>
                                {preThesis.reportSubmittedAt && (
                                    <span className="submission-date">
                                        Latest submission: {formatDateToVietnam(preThesis.reportSubmittedAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Project File Submission */}
                <div className="submission-section">
                    <h3 className="submission-type-title">Project File Submission</h3>
                    <form onSubmit={handleProjectSubmission} className="submission-form">
                        <div className="file-input-row">
                            <div className="file-input-group">
                                <label htmlFor="project-file" className="file-label">
                                    Choose Project File (ZIP/RAR):
                                </label>
                                <input
                                    type="file"
                                    id="project-file"
                                    name="file"
                                    accept=".zip,.rar"
                                    className="file-input"
                                    disabled={uploading && uploadType === 'project'}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`submit-btn ${preThesis.project ? 'resubmit' : 'initial'}`}
                                disabled={uploading && uploadType === 'project'}
                            >
                                {uploading && uploadType === 'project' ? (
                                    <span>
                                        <span className="spinner"></span>
                                        Uploading...
                                    </span>
                                ) : (
                                    preThesis.project ? 'Resubmit Project File' : 'Submit Project File'
                                )}
                            </button>
                        </div>
                    </form>
                    {preThesis.project && (
                        <div className="submission-status">
                            <div className="file-status-container">
                                <span className="status-text">
                                    ✓ Project file submitted: <span className="file-name">{getFileName(preThesis.project)}</span>
                                    {preThesis.projectSubmissionCount > 1 && (
                                        <span className="submission-count"> (Latest of {preThesis.projectSubmissionCount} submissions)</span>
                                    )}
                                </span>
                                <button 
                                    className="download-btn"
                                    onClick={() => handleDownload(preThesis.project, 'project')}
                                    title="Download latest project file"
                                >
                                    📁 Download Project
                                </button>
                                {preThesis.projectSubmittedAt && (
                                    <span className="submission-date">
                                        Latest submission: {formatDateToVietnam(preThesis.projectSubmittedAt)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Video URL Submission */}
                <div className="submission-section">
                    <h3 className="submission-type-title">Demo Submission</h3>
                        <form onSubmit={handleVideoSubmission} className="submission-form">
                        <div className="file-input-row">
                            <div className="file-input-group">
                                <label htmlFor="video-url" className="file-label">
                                    Enter YouTube URL - Optional:
                                </label>
                                <input
                                    type="url"
                                    id="video-url"
                                    name="videoUrl"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                                    className="url-input"
                                    disabled={uploading && uploadType === 'video'}
                                />
                            </div>
                            <button
                                type="submit"
                                className={`submit-btn ${preThesis.videoUrl ? 'resubmit' : 'initial'}`}
                                disabled={uploading && uploadType === 'video'}
                            >
                                {uploading && uploadType === 'video' ? (
                                    <span>
                                        <span className="spinner"></span>
                                        Uploading...
                                    </span>
                                ) : (
                                    preThesis.videoUrl ? 'Resubmit YouTube URL' : 'Submit YouTube URL'
                                )}
                            </button>
                        </div>
                    </form>
                    {preThesis.videoUrl && (
                        <div className="submission-status">
                            <div className="video-submission-container">
                                <span className="status-text">
                                    ✓ Demo submitted:
                                </span>
                                <a 
                                    href={preThesis.videoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="video-link"
                                    title="Open video in new tab"
                                >
                                    🎥 Open in YouTube
                                </a>
                            </div>
                            
                            {/* Enhanced Privacy YouTube Video */}
                            <div className="embedded-video-container">
                                <h4 className="video-title">Demo Video Preview:</h4>
                                <div className="video-wrapper">
                                    <iframe
                                        src={getYouTubeEmbedUrl(preThesis.videoUrl)}
                                        title="Pre-thesis Demo Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        className="youtube-iframe"
                                        loading="lazy"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PreThesisHome;