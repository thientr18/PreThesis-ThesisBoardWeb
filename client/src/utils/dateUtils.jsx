export const formatDateToVietnam = (dateString, options = {}) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    const defaultOptions = {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...options
    };
    
    return date.toLocaleString('en-US', defaultOptions);
};

export const formatDateOnlyToVietnam = (dateString) => {
    return formatDateToVietnam(dateString, {
        hour: undefined,
        minute: undefined
    });
};

export const isDeadlinePassed = (deadlineString) => {
    if (!deadlineString) return false;
    
    const deadline = new Date(deadlineString);
    const now = new Date();
    
    // Convert both to Vietnam timezone for comparison
    const vietnamNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const vietnamDeadline = new Date(deadline.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    
    return vietnamNow > vietnamDeadline;
};