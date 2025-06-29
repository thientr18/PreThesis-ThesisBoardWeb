import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/utils/axios";

const SemesterAssignment = () => {
    const { user } = useAuth();
    
    const [semesters, setSemesters] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState("");
    const [assignedTeachers, setAssignedTeachers] = useState([]);
    const [availableTeachers, setAvailableTeachers] = useState([]);
    const [selectedTeachers, setSelectedTeachers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectAll, setSelectAll] = useState(false);

    // Add slot configuration state
    const [slotConfig, setSlotConfig] = useState({
        maxPreThesisSlots: 0,
        maxThesisSlots: 0
    });
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [editSlotConfig, setEditSlotConfig] = useState({
        maxPreThesisSlots: 0,
        maxThesisSlots: 0
    });

    // Fetch initial data
    useEffect(() => {
        fetchSemesters();
        fetchTeachers();
    }, []);

    // Auto-select newest semester and fetch assigned teachers
    useEffect(() => {
        if (semesters.length > 0 && !selectedSemester) {
            const newestSemester = semesters.reduce((newest, current) => {
                return new Date(current.createdAt || current.startDate) > new Date(newest.createdAt || newest.startDate) ? current : newest;
            });
            setSelectedSemester(newestSemester.id.toString());
        }
    }, [semesters]);

    // Fetch assigned teachers when semester changes
    useEffect(() => {
        if (selectedSemester) {
            fetchAssignedTeachers(selectedSemester);
        }
    }, [selectedSemester, teachers]);

    const fetchSemesters = async () => {
        try {
            const response = await api.get('/admin/semesters');
            // Process semesters to extract dates from configurations
            const processedSemesters = (response.data || []).map(semester => {
                const startDateConfig = semester.configurations?.find(config => config.key.includes('start_date'));
                const endDateConfig = semester.configurations?.find(config => config.key.includes('end_date'));
                
                return {
                    ...semester,
                    startDate: startDateConfig?.value || null,
                    endDate: endDateConfig?.value || null
                };
            });
            
            setSemesters(processedSemesters);
        } catch (error) {
            console.error('Error fetching semesters:', error);
            setError('Failed to fetch semesters');
        }
    };

    const fetchTeachers = async () => {
        try {
            const response = await api.get('/admin/teachers');
            setTeachers(response.data || []);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            setError('Failed to fetch teachers');
        }
    };

    const fetchAssignedTeachers = async (semesterId) => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/semesters/${semesterId}/teachers`);
            const assigned = response.data || [];
            setAssignedTeachers(assigned);
            
            // Filter available teachers (exclude assigned ones)
            const assignedIds = assigned.map(teacher => teacher.id);
            const available = teachers.filter(teacher => !assignedIds.includes(teacher.id));
            setAvailableTeachers(available);
            setSelectedTeachers([]);
            setSelectAll(false);
        } catch (error) {
            console.error('Error fetching assigned teachers:', error);
            setAssignedTeachers([]);
            setAvailableTeachers(teachers);
        } finally {
            setLoading(false);
        }
    };

    const assignSelectedTeachers = async () => {
        if (selectedTeachers.length === 0) {
            setError('Please select at least one teacher to assign');
            setTimeout(() => setError(""), 3000);
            return;
        }

        try {
            setLoading(true);
            await api.post(`/admin/semesters/${selectedSemester}/teachers/assign-multiple`, {
                teacherIds: selectedTeachers,
                maxPreThesisSlots: slotConfig.maxPreThesisSlots,
                maxThesisSlots: slotConfig.maxThesisSlots
            });
            
            setSuccess(`${selectedTeachers.length} teachers assigned successfully`);
            fetchAssignedTeachers(selectedSemester);
            
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error('Error assigning teachers:', error);
            setError('Failed to assign teachers');
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const editTeacherSlots = (teacherId) => {
        const teacher = assignedTeachers.find(t => t.id === teacherId);
        if (teacher) {
            setEditingTeacher(teacher);
            setEditSlotConfig({
                maxPreThesisSlots: teacher.TeacherSemester?.maxPreThesisSlots || 0,
                maxThesisSlots: teacher.TeacherSemester?.maxThesisSlots || 0
            });
            setShowSlotModal(true);
        }
    };

    const updateTeacherSlots = async () => {
        try {
            setLoading(true);
            await api.put(`/admin/semesters/${selectedSemester}/teachers/${editingTeacher.id}/slots`, {
                maxPreThesisSlots: editSlotConfig.maxPreThesisSlots,
                maxThesisSlots: editSlotConfig.maxThesisSlots
            });
            
            setSuccess('Teacher slots updated successfully');
            fetchAssignedTeachers(selectedSemester);
            setShowSlotModal(false);
            setEditingTeacher(null);
            
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error('Error updating teacher slots:', error);
            setError('Failed to update teacher slots');
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const unassignTeacher = async (teacherId) => {
        try {
            setLoading(true);
            await api.delete(`/admin/semesters/${selectedSemester}/teachers/${teacherId}/unassign`);
            
            setSuccess('Teacher unassigned successfully');
            fetchAssignedTeachers(selectedSemester);
            
            setTimeout(() => setSuccess(""), 3000);
        } catch (error) {
            console.error('Error unassigning teacher:', error);
            setError('Failed to unassign teacher');
            setTimeout(() => setError(""), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleTeacherSelect = (teacherId) => {
        setSelectedTeachers(prev => {
            if (prev.includes(teacherId)) {
                return prev.filter(id => id !== teacherId);
            } else {
                return [...prev, teacherId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedTeachers([]);
        } else {
            setSelectedTeachers(filteredAvailableTeachers.map(t => t.id));
        }
        setSelectAll(!selectAll);
    };

    // Filter teachers based on search term
    const filteredAvailableTeachers = availableTeachers.filter(teacher =>
        teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Check if user is admin
    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Teacher-Semester Assignment</h1>
                    <p className="mt-2 text-gray-600">Assign teachers to semesters for thesis supervision</p>
                </div>

                {/* Error and Success Messages */}
                {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                        {success}
                    </div>
                )}

                {/* Semester Selection */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Semester</h2>
                    <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Choose a semester...</option>
                        {semesters.map(semester => (
                            <option key={semester.id} value={semester.id}>
                                {semester.name} ({new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Slot Configuration Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Default Slot Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Pre-Thesis Slots per Teacher
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={slotConfig.maxPreThesisSlots}
                                onChange={(e) => setSlotConfig(prev => ({
                                    ...prev,
                                    maxPreThesisSlots: parseInt(e.target.value) || 0
                                }))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., 5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Thesis Slots per Teacher
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="20"
                                value={slotConfig.maxThesisSlots}
                                onChange={(e) => setSlotConfig(prev => ({
                                    ...prev,
                                    maxThesisSlots: parseInt(e.target.value) || 0
                                }))}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., 3"
                            />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                        <span className="font-medium">Note:</span> These slot limits will be applied to all selected teachers when assigned. 
                        You can modify individual teacher slots later after assignment.
                    </p>
                </div>

                {selectedSemester && (
                    <>
                        {/* Assignment Section */}
                        <div className="bg-white shadow rounded-lg p-6 mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Assign Teachers ({filteredAvailableTeachers.length} available)
                                </h2>
                                <button
                                    onClick={assignSelectedTeachers}
                                    disabled={loading || selectedTeachers.length === 0}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Assign Selected ({selectedTeachers.length})
                                </button>
                            </div>

                            {/* Search and Filter Controls */}
                            <div className="mb-4 space-y-3">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            placeholder="Search teachers by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSelectAll}
                                            disabled={filteredAvailableTeachers.length === 0}
                                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {selectAll ? 'Deselect All' : 'Select All'}
                                        </button>
                                        {selectedTeachers.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    setSelectedTeachers([]);
                                                    setSelectAll(false);
                                                }}
                                                className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 whitespace-nowrap"
                                            >
                                                Clear ({selectedTeachers.length})
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Results Summary */}
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span>
                                        {searchTerm && (
                                            <>Showing {filteredAvailableTeachers.length} of {availableTeachers.length} teachers</>
                                        )}
                                        {!searchTerm && (
                                            <>Total: {availableTeachers.length} available teachers</>
                                        )}
                                    </span>
                                    {selectedTeachers.length > 0 && (
                                        <span className="text-blue-600 font-medium">
                                            {selectedTeachers.length} selected
                                        </span>
                                    )}
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-2 text-gray-600">Loading...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Teacher Grid */}
                                    <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                                        {filteredAvailableTeachers.length > 0 ? (
                                            <div className="divide-y divide-gray-200">
                                                {filteredAvailableTeachers.map((teacher, index) => (
                                                    <div 
                                                        key={teacher.id} 
                                                        className={`flex items-center p-4 cursor-pointer transition-all duration-200 ${
                                                            selectedTeachers.includes(teacher.id)
                                                                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                                                : 'bg-white hover:bg-gray-50'
                                                        }`}
                                                        onClick={() => handleTeacherSelect(teacher.id)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTeachers.includes(teacher.id)}
                                                            onChange={() => {}}
                                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded pointer-events-none"
                                                        />
                                                        <div className="ml-4 flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className={`text-sm font-medium ${
                                                                        selectedTeachers.includes(teacher.id) ? 'text-blue-900' : 'text-gray-900'
                                                                    }`}>
                                                                        {teacher.fullName || teacher.name}
                                                                    </p>
                                                                    <p className={`text-xs ${
                                                                        selectedTeachers.includes(teacher.id) ? 'text-blue-700' : 'text-gray-600'
                                                                    }`}>
                                                                        {teacher.email}
                                                                    </p>
                                                                    {teacher.department && (
                                                                        <p className={`text-xs ${
                                                                            selectedTeachers.includes(teacher.id) ? 'text-blue-600' : 'text-gray-500'
                                                                        }`}>
                                                                            {teacher.department}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-400">
                                                                    #{index + 1}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                {searchTerm ? (
                                                    <div>
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                        </svg>
                                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers found</h3>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            No teachers match your search for "{searchTerm}"
                                                        </p>
                                                        <button
                                                            onClick={() => setSearchTerm("")}
                                                            className="mt-3 text-blue-600 hover:text-blue-500 text-sm"
                                                        >
                                                            Clear search
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                                        </svg>
                                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No available teachers</h3>
                                                        <p className="mt-1 text-sm text-gray-500">
                                                            All teachers are already assigned to this semester.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Quick Actions Footer */}
                                    {filteredAvailableTeachers.length > 0 && (
                                        <div className="mt-4 flex justify-between items-center text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const visibleIds = filteredAvailableTeachers.map(t => t.id);
                                                        const newSelected = [...new Set([...selectedTeachers, ...visibleIds])];
                                                        setSelectedTeachers(newSelected);
                                                    }}
                                                    disabled={filteredAvailableTeachers.every(t => selectedTeachers.includes(t.id))}
                                                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Select Visible
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const visibleIds = filteredAvailableTeachers.map(t => t.id);
                                                        const newSelected = selectedTeachers.filter(id => !visibleIds.includes(id));
                                                        setSelectedTeachers(newSelected);
                                                    }}
                                                    disabled={!filteredAvailableTeachers.some(t => selectedTeachers.includes(t.id))}
                                                    className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Deselect Visible
                                                </button>
                                            </div>
                                            <span className="text-gray-500">
                                                Use Ctrl+F to search within the page
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Assigned Teachers with Enhanced Search */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Assigned Teachers ({assignedTeachers.length})
                                </h2>
                                {assignedTeachers.length > 5 && (
                                    <div className="text-sm text-gray-500">
                                        Use Ctrl+F to quickly find a teacher
                                    </div>
                                )}
                            </div>
                            
                            <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                                {assignedTeachers.length > 0 ? (
                                    <div className="divide-y divide-gray-200">
                                        {assignedTeachers.map((teacher, index) => (
                                            <div 
                                                key={teacher.id} 
                                                className="flex items-center justify-between p-4 hover:bg-green-50 transition-colors duration-200"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <p className="text-sm font-medium text-green-900">
                                                                {teacher.fullName || teacher.name}
                                                            </p>
                                                            <p className="text-xs text-green-700">{teacher.email}</p>
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            #{index + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-xs">
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                                            Pre-Thesis: {teacher.TeacherSemester?.remainingPreThesisSlots || 0}/{teacher.TeacherSemester?.maxPreThesisSlots || 0}
                                                        </span>
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                            Thesis: {teacher.TeacherSemester?.remainingThesisSlots || 0}/{teacher.TeacherSemester?.maxThesisSlots || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2 ml-4">
                                                    <button
                                                        onClick={() => editTeacherSlots(teacher.id)}
                                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors duration-200"
                                                    >
                                                        Edit Slots
                                                    </button>
                                                    <button
                                                        onClick={() => unassignTeacher(teacher.id)}
                                                        disabled={loading}
                                                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No teachers assigned</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            No teachers are currently assigned to this semester.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Edit Slots Modal */}
            {showSlotModal && editingTeacher && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                Edit Slots for {editingTeacher.fullName || editingTeacher.name}
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Pre-Thesis Slots
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={editSlotConfig.maxPreThesisSlots}
                                        onChange={(e) => setEditSlotConfig(prev => ({
                                            ...prev,
                                            maxPreThesisSlots: parseInt(e.target.value) || 0
                                        }))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Max Thesis Slots
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={editSlotConfig.maxThesisSlots}
                                        onChange={(e) => setEditSlotConfig(prev => ({
                                            ...prev,
                                            maxThesisSlots: parseInt(e.target.value) || 0
                                        }))}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="bg-gray-50 p-3 rounded text-sm">
                                    <p className="text-gray-600 mb-1">Current slots:</p>
                                    <p className="text-green-700">Pre-Thesis: {editingTeacher.TeacherSemester?.remainingPreThesisSlots || 0}/{editingTeacher.TeacherSemester?.maxPreThesisSlots || 0}</p>
                                    <p className="text-blue-700">Thesis: {editingTeacher.TeacherSemester?.remainingThesisSlots || 0}/{editingTeacher.TeacherSemester?.maxThesisSlots || 0}</p>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex space-x-3">
                                <button
                                    onClick={updateTeacherSlots}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                                >
                                    {loading ? 'Updating...' : 'Update Slots'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowSlotModal(false);
                                        setEditingTeacher(null);
                                    }}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default SemesterAssignment;