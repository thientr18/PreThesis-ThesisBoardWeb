const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directories if they don't exist
const uploadsBaseDir = path.join(__dirname, '../../uploads');
const preThesisDir = path.join(uploadsBaseDir, 'pre-thesis');
const thesisDir = path.join(uploadsBaseDir, 'thesis');

// Ensure directories exist
[uploadsBaseDir, preThesisDir, thesisDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage for pre-thesis
const preThesisStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, preThesisDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const originalNameWithoutExt = path.basename(file.originalname, extension);
        cb(null, `prethesis-${uniqueSuffix}-${originalNameWithoutExt}${extension}`);
    }
});

// Configure storage for thesis
const thesisStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, thesisDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        const originalNameWithoutExt = path.basename(file.originalname, extension);
        cb(null, `thesis-${uniqueSuffix}-${originalNameWithoutExt}${extension}`);
    }
});

const createFileFilter = (allowedFieldTypes) => {
    return (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        const fieldAllowedTypes = allowedFieldTypes[file.fieldname] || [];
        
        if (fieldAllowedTypes.includes(extension)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type for ${file.fieldname}. Allowed: ${fieldAllowedTypes.join(', ')}`), false);
        }
    };
};

// Pre-thesis file types
const preThesisFileTypes = {
    'report': ['.pdf', '.doc', '.docx'],
    'project': ['.zip', '.rar']
};

// Thesis file types (more comprehensive)
const thesisFileTypes = {
    'report': ['.pdf', '.doc', '.docx'],
    'project': ['.zip', '.rar'],
    'presentation': ['.pdf', '.ppt', '.pptx'],
};

// Configure multer
const preThesisUpload = multer({
    storage: preThesisStorage,
    fileFilter: createFileFilter(preThesisFileTypes),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

const thesisUpload = multer({
    storage: thesisStorage,
    fileFilter: createFileFilter(thesisFileTypes),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

const uploadPreThesisReportFile = preThesisUpload.single('report');
const uploadPreThesisProjectFile = preThesisUpload.single('project');

const uploadThesisReportFile = thesisUpload.single('report');
const uploadThesisProjectFile = thesisUpload.single('project');
const uploadThesisPresentationFile = thesisUpload.single('presentation');

module.exports = {
    uploadPreThesisReportFile,
    uploadPreThesisProjectFile,
    uploadThesisReportFile,
    uploadThesisProjectFile,
    uploadThesisPresentationFile
};