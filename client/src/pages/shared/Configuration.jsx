import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/utils/axios";

const Configuration = () => {
    const { user, loading } = useAuth();
    const [configurations, setConfigurations] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [commonConfigurations, setCommonConfigurations] = useState({
        activeSemester: null,
        currentSemester: null,
        waitingSemesters: []
    });
    const [editConfigurations, setEditConfigurations] = useState([]);
    const [editFormData, setEditFormData] = useState({});
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCommonModal, setShowCommonModal] = useState(false);
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        preThesisRegistrationDeadline: '',
        preThesisSubmissionDeadline: '',
        thesisRegistrationDeadline: '',
        thesisSubmissionDeadline: ''
    });

    useEffect(() => {
        if (!user || !user.role) return; // <-- Add this guard

        const fetchSemesters = async () => {
            try {
                const role = user.role;
                if (role !== 'admin' && role !== 'moderator') {
                    alert('You do not have permission to access this page.');
                    console.log(`Unauthorized access attempt by user with role: ${role}`);
                    navigate('/unauthorized');
                    return;
                }
                const response = await api.get(`/${role}/semesters/`);
                const semesterData = response.data || [];
                setSemesters(semesterData);

                // Auto-select the newest semester
                if (semesterData.length > 0 && !selectedSemester) {
                    const newestSemester = semesterData[0];
                    setSelectedSemester(newestSemester.id.toString());
                }
            } catch (error) {
                console.error("Error fetching semesters:", error);
                setSemesters([]);
            }
        };

        const fetchCommonConfigurations = async () => {
            try {
                const response = await api.get('/configurations/common/all');
                if (response.data && response.data.configurations) {
                    setCommonConfigurations({
                        ...response.data.configurations,
                        waitingSemesters: Array.isArray(response.data.configurations.waitingSemesters) 
                            ? response.data.configurations.waitingSemesters 
                            : []
                    });
                } else {
                    setCommonConfigurations({
                        activeSemester: null,
                        currentSemester: null,
                        waitingSemesters: []
                    });
                }
            } catch (error) {
                setCommonConfigurations({
                    activeSemester: null,
                    currentSemester: null,
                    waitingSemesters: []
                });
            }
        };

        fetchSemesters();
        fetchCommonConfigurations();
    }, [user]);

    useEffect(() => {
        const fetchConfigurations = async () => {
            if (selectedSemester) {
                try {
                    const response = await api.get(`/configurations/${selectedSemester}`);
                    setConfigurations(response.data || []);
                } catch (error) {
                    console.error("Error fetching configurations:", error);
                }
            } else {
                setConfigurations([]);
            }
        };

        fetchConfigurations();
    }, [selectedSemester]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    }

    const handleCommonConfigChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'waitingSemesters') {
            const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
            setCommonConfigurations({
                ...commonConfigurations,
                [name]: selectedOptions
            });
        } else {
            setCommonConfigurations({
                ...commonConfigurations,
                [name]: value || null
            });
        }
    }

    const handleWaitingSemesterToggle = (semesterId) => {
        const currentWaiting = Array.isArray(commonConfigurations.waitingSemesters) 
            ? commonConfigurations.waitingSemesters 
            : [];
        const isSelected = currentWaiting.includes(semesterId);
        
        let newWaitingSemesters;
        if (isSelected) {
            newWaitingSemesters = currentWaiting.filter(id => id !== semesterId);
        } else {
            newWaitingSemesters = [...currentWaiting, semesterId];
        }
        
        setCommonConfigurations({
            ...commonConfigurations,
            waitingSemesters: newWaitingSemesters
        });
    }

    const handleUpdateCommonConfigurations = async () => {
        try {
            // Ensure we're calling the correct endpoint for common configurations
            const response = await api.put('/configurations/common/update', {
                activeSemester: commonConfigurations.activeSemester,
                currentSemester: commonConfigurations.currentSemester,
                waitingSemesters: Array.isArray(commonConfigurations.waitingSemesters) 
                    ? commonConfigurations.waitingSemesters 
                    : []
            });
            
            alert('Common configurations updated successfully!');
            setShowCommonModal(false);
            
            // Refresh common configurations
            const refreshResponse = await api.get('/configurations/common/all');
            if (refreshResponse.data && refreshResponse.data.configurations) {
                setCommonConfigurations({
                    ...refreshResponse.data.configurations,
                    waitingSemesters: Array.isArray(refreshResponse.data.configurations.waitingSemesters) 
                        ? refreshResponse.data.configurations.waitingSemesters 
                        : []
                });
            }
        } catch (error) {
            console.error("Error updating common configurations:", error);
            console.error("Error response:", error.response?.data);
            alert(`Failed to update common configurations: ${error.response?.data?.error || error.message}`);
        }
    }
    
    if (loading) {
        return <div className="config-container">Loading...</div>;
    }

    const handleAddSemester = async () => {
        try {
            if (!formData.name || !formData.startDate || !formData.endDate) {
                alert('Please fill in all required fields');
                return;
            }

            const response = await api.post('/semesters/new', formData);

            const semestersResponse = await api.get(`/${user.role}/semesters/`);
            setSemesters(semestersResponse.data || []);
            setFormData({
                name: '',
                startDate: '',
                endDate: '',
                preThesisRegistrationDeadline: '',
                preThesisSubmissionDeadline: '',
                thesisRegistrationDeadline: '',
                thesisSubmissionDeadline: ''
            });
            setShowModal(false);
            setSelectedSemester(response.data.id);
            alert('Semester added successfully!');
        } catch (error) {
            console.error("Error adding semester:", error);
            alert('Failed to add semester. Please try again.');
        }
    }

    const getSemesterName = (semesterId) => {
        const semester = semesters.find(s => s.id == semesterId);
        return semester ? semester.name : 'None';
    };

    const getWaitingSemesterNames = (waitingSemesters) => {
        if (!waitingSemesters || waitingSemesters.length === 0) return 'None';
        return waitingSemesters.map(id => getSemesterName(id)).join(', ');
    };

    const handleEditConfiguration = () => {
        if (!selectedSemester || configurations.length === 0) {
            alert('No configurations to edit');
            return;
        }

        // Prepare form data from existing configurations
        const formData = {};
        configurations.forEach(config => {
            // Remove semesterId suffix from key for form handling
            const baseKey = config.key.replace(`_${selectedSemester}`, '');
            formData[baseKey] = config.value;
        });

        setEditFormData(formData);
        setEditConfigurations([...configurations]);
        setShowEditModal(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({
            ...editFormData,
            [name]: value
        });
    };

    const handleUpdateConfigurations = async () => {
        try {
            if (!selectedSemester) {
                alert('No semester selected');
                return;
            }

            // Transform form data back to configuration format
            const updatedConfigurations = Object.keys(editFormData).map(key => {
                const existingConfig = configurations.find(config => 
                    config.key === `${key}_${selectedSemester}`
                );
                
                return {
                    key: `${key}_${selectedSemester}`,
                    name: existingConfig ? existingConfig.name : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    value: editFormData[key],
                    scope: 'semester',
                    semesterId: parseInt(selectedSemester)
                };
            });

            const response = await api.put(`/configurations/${selectedSemester}/update`, updatedConfigurations);

            // Refresh configurations
            const configResponse = await api.get(`/configurations/${selectedSemester}`);
            setConfigurations(configResponse.data || []);

            setShowEditModal(false);
            alert('Configurations updated successfully!');

        } catch (error) {
            console.error("Error updating configurations:", error);
            console.error("Error response:", error.response?.data);
            alert(`Failed to update configurations: ${error.response?.data?.details || error.message}`);
        }
    };

    return (
        <div className="config-container">
            <div className="config-header">
                <h1>System Configurations</h1>
                <p className="config-subtitle">Manage semester settings and deadlines</p>
            </div>

            <div className="config-content">
                {/* Common Configurations Card */}
                <div className="common-config-card">
                    <div className="card-header">
                        <h3>Common System Settings</h3>
                        <button 
                            onClick={() => setShowCommonModal(true)} 
                            className="btn-edit-config"
                            title="Edit Common Settings"
                        >
                            <img src="/gear-solid.svg" alt="Settings" />
                            Configure
                        </button>
                    </div>
                    
                    <div className="common-config-grid">
                        <div className="common-config-item">
                            <div className="config-label">Active Semester</div>
                            <div className="config-value active-semester">
                                {getSemesterName(commonConfigurations.activeSemester)}
                            </div>
                        </div>
                        <div className="common-config-item">
                            <div className="config-label">Current Semester</div>
                            <div className="config-value current-semester">
                                {getSemesterName(commonConfigurations.currentSemester)}
                            </div>
                        </div>
                        <div className="common-config-item waiting-semesters-item">
                            <div className="config-label">Waiting Semesters</div>
                            <div className="config-value waiting-semesters">
                                {getWaitingSemesterNames(commonConfigurations.waitingSemesters)}
                            </div>
                            <div className="waiting-count">
                                {commonConfigurations.waitingSemesters?.length || 0} semester(s) available for viewing
                            </div>
                        </div>
                    </div>
                </div>

                {/* Semester Selection Card */}
                <div className="semester-selection-card">
                    <div className="card-header">
                        <h3>Select Semester</h3>
                        <button 
                            onClick={() => setShowModal(true)} 
                            className="btn-add-semester"
                            title="Add New Semester"
                        >
                            <img src="/plus-solid.svg" alt="Add" />
                            <span>Add Semester</span>
                        </button>
                    </div>
                    
                    {semesters.length > 0 ? (
                        <div className="semester-dropdown-wrapper">
                            <label htmlFor="semester-select">Choose Semester:</label>
                            <select
                                id="semester-select"
                                value={selectedSemester || ''}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="semester-select-enhanced"
                            >
                                <option value="" disabled>Select a semester</option>
                                {semesters.map((semester) => (
                                    <option key={semester.id} value={semester.id}>
                                        {semester.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <img src="/calendar-solid.svg" alt="No semesters" className="empty-icon" />
                            <p>No semesters available</p>
                            <span>Create your first semester to get started</span>
                        </div>
                    )}
                </div>

                {/* Configuration Display Card */}
                {selectedSemester && (
                    <div className="configuration-display-card">
                        <div className="card-header">
                            <h3>
                                Configurations for{' '}
                                <span className="semester-name">
                                    {semesters.find(s => s.id == selectedSemester)?.name}
                                </span>
                            </h3>
                            <button
                                className="btn-edit-config"
                                title="Edit Configurations"
                                onClick={handleEditConfiguration}
                            >
                                <img src="/pen-to-square-solid.svg" alt="Edit" />
                                Edit
                            </button>
                        </div>

                        {configurations.length > 0 ? (
                            <div className="config-grid">
                                {configurations.map(config => (
                                    <div key={config._id} className="config-item">
                                        <div className="config-label">{config.name}</div>
                                        <div className="config-value">
                                            {config.key.includes('date') || config.key.includes('deadline') 
                                                ? new Date(config.value).toLocaleDateString()
                                                : config.value
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-config-state">
                                <img src="/gear-solid.svg" alt="No configurations" className="empty-icon" />
                                <p>No configurations found</p>
                                <span>Configurations will appear here once created</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Common Configurations Modal */}
            {showCommonModal && (
                <div className="modal-overlay" onClick={() => setShowCommonModal(false)}>
                    <div className="modal-form enhanced-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Common System Settings</h2>
                            <button 
                                className="modal-close-btn"
                                onClick={() => setShowCommonModal(false)}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-content">
                            <div className="form-section">
                                <h3 className="section-title">
                                    <img src="/gear-solid.svg" alt="" className="section-icon" />
                                    Semester Status Configuration
                                </h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="activeSemester">
                                            Active Semester
                                        </label>
                                        <select 
                                            id="activeSemester"
                                            name="activeSemester" 
                                            value={commonConfigurations.activeSemester || ''} 
                                            onChange={handleCommonConfigChange} 
                                            className="form-input"
                                        >
                                            <option value="">Select Active Semester</option>
                                            {semesters.map((semester) => (
                                                <option key={semester.id} value={semester.id}>
                                                    {semester.name}
                                                </option>
                                            ))}
                                        </select>
                                        <small className="field-description">
                                            The semester currently accepting registrations
                                        </small>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="currentSemester">
                                            Current Semester
                                        </label>
                                        <select 
                                            id="currentSemester"
                                            name="currentSemester" 
                                            value={commonConfigurations.currentSemester || ''} 
                                            onChange={handleCommonConfigChange} 
                                            className="form-input"
                                        >
                                            <option value="">Select Current Semester</option>
                                            {semesters.map((semester) => (
                                                <option key={semester.id} value={semester.id}>
                                                    {semester.name}
                                                </option>
                                            ))}
                                        </select>
                                        <small className="field-description">
                                            The semester currently in progress
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Waiting Semesters Section */}
                            <div className="form-section">
                                <h3 className="section-title">
                                    <img src="/eye-solid.svg" alt="" className="section-icon" />
                                    Waiting Semesters (Allow View)
                                </h3>
                                <p className="section-description">
                                    Select which semesters students can view and access their data from. 
                                    Students will only be able to see semesters that are marked as "Allow View".
                                </p>
                                
                                <div className="waiting-semesters-controls">
                                    <div className="control-buttons">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const allSemesterIds = semesters.map(s => s.id);
                                                setCommonConfigurations({
                                                    ...commonConfigurations,
                                                    waitingSemesters: allSemesterIds
                                                });
                                            }}
                                            className="btn-control select-all"
                                        >
                                            Select All
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setCommonConfigurations({
                                                    ...commonConfigurations,
                                                    waitingSemesters: []
                                                });
                                            }}
                                            className="btn-control deselect-all"
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                    
                                    <div className="semester-count">
                                        {commonConfigurations.waitingSemesters?.length || 0} of {semesters.length} semester(s) selected
                                    </div>
                                </div>

                                <div className="waiting-semesters-grid">
                                    {semesters.map((semester) => (
                                        <div key={semester.id} className="semester-checkbox-item">
                                            <label className="checkbox-container">
                                                <input
                                                    type="checkbox"
                                                    checked={commonConfigurations.waitingSemesters?.includes(semester.id) || false}
                                                    onChange={() => handleWaitingSemesterToggle(semester.id)}
                                                />
                                                <span className="checkmark"></span>
                                                <div className="semester-info">
                                                    <strong className="semester-title">{semester.name}</strong>
                                                    <div className="semester-dates">
                                                        {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                                                    </div>
                                                    <div className="semester-status">
                                                        <span className={`status-badge ${semester.isActive ? 'active' : ''} ${semester.isCurrent ? 'current' : ''}`}>
                                                            {semester.isActive ? 'Active' : semester.isCurrent ? 'Current' : 'Inactive'}
                                                        </span>
                                                        {semester.allowView && (
                                                            <span className="status-badge viewing">Currently Viewable</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                {semesters.length === 0 && (
                                    <div className="empty-semesters">
                                        <p>No semesters available. Create semesters first to configure waiting permissions.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                onClick={() => setShowCommonModal(false)} 
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdateCommonConfigurations} 
                                className="btn btn-primary"
                            >
                                <img src="/floppy-disk-solid.svg" alt="" className="btn-icon" />
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Modal for Add Semester */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-form enhanced-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Semester</h2>
                            <button 
                                className="modal-close-btn"
                                onClick={() => setShowModal(false)}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-content">
                            {/* Basic Info Section */}
                            <div className="form-section">
                                <h3 className="section-title">
                                    <img src="/calendar-solid.svg" alt="" className="section-icon" />
                                    Semester Details
                                </h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="name">
                                            Semester Name <span className="required">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            id="name"
                                            name="name" 
                                            value={formData.name} 
                                            onChange={handleChange} 
                                            placeholder="e.g., Fall 2024" 
                                            className="form-input"
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="startDate">
                                            Start Date <span className="required">*</span>
                                        </label>
                                        <input 
                                            type="date" 
                                            id="startDate"
                                            name="startDate" 
                                            value={formData.startDate} 
                                            onChange={handleChange} 
                                            className="form-input"
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="endDate">
                                            End Date <span className="required">*</span>
                                        </label>
                                        <input 
                                            type="date" 
                                            id="endDate"
                                            name="endDate" 
                                            value={formData.endDate} 
                                            onChange={handleChange} 
                                            className="form-input"
                                            required 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pre-Thesis Section */}
                            <div className="form-section">
                                <h3 className="section-title">
                                    <img src="/file-solid.svg" alt="" className="section-icon" />
                                    Pre-Thesis Deadlines
                                </h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="preThesisRegistrationDeadline">
                                            Registration Deadline <span className="required">*</span>
                                        </label>
                                        <input 
                                            type="date" 
                                            id="preThesisRegistrationDeadline"
                                            name="preThesisRegistrationDeadline" 
                                            value={formData.preThesisRegistrationDeadline} 
                                            onChange={handleChange} 
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="preThesisSubmissionDeadline">
                                            Submission Deadline <span className="required">*</span>
                                        </label>
                                        <input 
                                            type="date" 
                                            id="preThesisSubmissionDeadline"
                                            name="preThesisSubmissionDeadline" 
                                            value={formData.preThesisSubmissionDeadline} 
                                            onChange={handleChange} 
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Thesis Section */}
                            <div className="form-section">
                                <h3 className="section-title">
                                    <img src="/graduation-cap-solid.svg" alt="" className="section-icon" />
                                    Thesis Deadlines
                                </h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="thesisRegistrationDeadline">
                                            Registration Deadline <span className="required">*</span>
                                        </label>
                                        <input 
                                            type="date" 
                                            id="thesisRegistrationDeadline"
                                            name="thesisRegistrationDeadline" 
                                            value={formData.thesisRegistrationDeadline} 
                                            onChange={handleChange} 
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="thesisSubmissionDeadline">
                                            Submission Deadline <span className="required">*</span>
                                        </label>
                                        <input 
                                            type="date" 
                                            id="thesisSubmissionDeadline"
                                            name="thesisSubmissionDeadline" 
                                            value={formData.thesisSubmissionDeadline} 
                                            onChange={handleChange} 
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleAddSemester} 
                                className="btn btn-primary"
                            >
                                <img src="/floppy-disk-solid.svg" alt="" className="btn-icon" />
                                Create Semester
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Edit Configuration Modal before the closing div */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-form enhanced-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Edit Semester Configurations</h2>
                            <button 
                                className="modal-close-btn"
                                onClick={() => setShowEditModal(false)}
                                title="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-content">
                            {/* Basic Info Section */}
                            <div className="form-section">
                                <h3 className="section-title">
                                    <img src="/calendar-solid.svg" alt="" className="section-icon" />
                                    Semester Details
                                </h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="edit-semester-name">
                                            Semester Name
                                        </label>
                                        <input 
                                            type="text" 
                                            id="edit-semester-name"
                                            name="semester_name" 
                                            value={editFormData.semester_name || ''} 
                                            onChange={handleEditFormChange} 
                                            placeholder="e.g., Fall 2024" 
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="edit-start-date">
                                            Start Date
                                        </label>
                                        <input 
                                            type="date" 
                                            id="edit-start-date"
                                            name="start_date" 
                                            value={editFormData.start_date ? new Date(editFormData.start_date).toISOString().split('T')[0] : ''} 
                                            onChange={handleEditFormChange} 
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="edit-end-date">
                                            End Date
                                        </label>
                                        <input 
                                            type="date" 
                                            id="edit-end-date"
                                            name="end_date" 
                                            value={editFormData.end_date ? new Date(editFormData.end_date).toISOString().split('T')[0] : ''} 
                                            onChange={handleEditFormChange} 
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pre-Thesis Section */}
                            <div className="form-section">
                                <h3 className="section-title">
                                    <img src="/file-solid.svg" alt="" className="section-icon" />
                                    Pre-Thesis Deadlines
                                </h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="edit-pre-thesis-reg">
                                            Registration Deadline
                                        </label>
                                        <input 
                                            type="date" 
                                            id="edit-pre-thesis-reg"
                                            name="pre_thesis_registration_deadline" 
                                            value={editFormData.pre_thesis_registration_deadline ? new Date(editFormData.pre_thesis_registration_deadline).toISOString().split('T')[0] : ''} 
                                            onChange={handleEditFormChange} 
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="edit-pre-thesis-sub">
                                            Submission Deadline
                                        </label>
                                        <input 
                                            type="date" 
                                            id="edit-pre-thesis-sub"
                                            name="pre_thesis_submission_deadline" 
                                            value={editFormData.pre_thesis_submission_deadline ? new Date(editFormData.pre_thesis_submission_deadline).toISOString().split('T')[0] : ''} 
                                            onChange={handleEditFormChange} 
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Thesis Section */}
                            <div className="form-section">
                                <h3 className="section-title">
                                    <img src="/graduation-cap-solid.svg" alt="" className="section-icon" />
                                    Thesis Deadlines
                                </h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="edit-thesis-reg">
                                            Registration Deadline
                                        </label>
                                        <input 
                                            type="date" 
                                            id="edit-thesis-reg"
                                            name="thesis_registration_deadline" 
                                            value={editFormData.thesis_registration_deadline ? new Date(editFormData.thesis_registration_deadline).toISOString().split('T')[0] : ''} 
                                            onChange={handleEditFormChange} 
                                            className="form-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="edit-thesis-sub">
                                            Submission Deadline
                                        </label>
                                        <input 
                                            type="date" 
                                            id="edit-thesis-sub"
                                            name="thesis_submission_deadline" 
                                            value={editFormData.thesis_submission_deadline ? new Date(editFormData.thesis_submission_deadline).toISOString().split('T')[0] : ''} 
                                            onChange={handleEditFormChange} 
                                            className="form-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                onClick={() => setShowEditModal(false)} 
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdateConfigurations} 
                                className="btn btn-primary"
                            >
                                <img src="/floppy-disk-solid.svg" alt="" className="btn-icon" />
                                Update Configurations
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Configuration;