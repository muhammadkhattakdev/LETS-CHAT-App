import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// File type validation
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi'];
const allowedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
const allowedDocumentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Determine file type and validate
const getFileType = (mimetype) => {
  if (allowedImageTypes.includes(mimetype)) return 'image';
  if (allowedVideoTypes.includes(mimetype)) return 'video';
  if (allowedAudioTypes.includes(mimetype)) return 'audio';
  if (allowedDocumentTypes.includes(mimetype)) return 'document';
  return 'file';
};

// Get max file size based on type
const getMaxFileSize = (fileType) => {
  switch (fileType) {
    case 'image': return MAX_IMAGE_SIZE;
    case 'video': return MAX_VIDEO_SIZE;
    case 'audio': return MAX_AUDIO_SIZE;
    case 'document': return MAX_DOCUMENT_SIZE;
    default: return MAX_DOCUMENT_SIZE;
  }
};

// File filter function
const fileFilter = (req, file, cb) => {
  const fileType = getFileType(file.mimetype);
  const maxSize = getMaxFileSize(fileType);

  // Check if file type is allowed
  if (fileType === 'file' && !allowedDocumentTypes.includes(file.mimetype)) {
    return cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }

  // Store file type in file object for later use
  file.fileType = fileType;
  file.maxSize = maxSize;

  cb(null, true);
};

// Cloudinary storage configuration for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat-app/avatars',
    allowed_formats: ['jpg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto' }
    ],
  },
});

// Cloudinary storage configuration for chat attachments
const attachmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const fileType = getFileType(file.mimetype);
    
    let folder = 'chat-app/attachments';
    let resourceType = 'auto';
    let transformation = [];

    switch (fileType) {
      case 'image':
        folder = 'chat-app/images';
        transformation = [{ quality: 'auto' }];
        break;
      case 'video':
        folder = 'chat-app/videos';
        resourceType = 'video';
        break;
      case 'audio':
        folder = 'chat-app/audio';
        resourceType = 'video'; // Cloudinary treats audio as video
        break;
      default:
        folder = 'chat-app/documents';
        resourceType = 'raw';
        break;
    }

    return {
      folder,
      resource_type: resourceType,
      transformation: transformation.length > 0 ? transformation : undefined,
    };
  },
});

// Multer configuration for avatars
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error('Only image files are allowed for avatars'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
});

// Multer configuration for chat attachments
export const uploadAttachment = multer({
  storage: attachmentStorage,
  fileFilter,
  limits: {
    fileSize: MAX_VIDEO_SIZE, // Use the largest limit, individual validation in controller
  },
});

// Middleware to handle file upload errors
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files',
      });
    }
  }

  if (error.message) {
    return res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }

  next(error);
};

// Validate file size based on type
export const validateFileSize = (file) => {
  const fileType = getFileType(file.mimetype);
  const maxSize = getMaxFileSize(fileType);
  
  if (file.size > maxSize) {
    throw new Error(`${fileType} files must be smaller than ${maxSize / 1024 / 1024}MB`);
  }
  
  return true;
};

// Process uploaded files for attachments
export const processAttachments = (files) => {
  if (!files || files.length === 0) return [];

  return files.map(file => {
    const fileType = getFileType(file.mimetype);
    
    return {
      type: fileType,
      url: file.path, // Cloudinary URL
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      cloudinaryId: file.filename, // Cloudinary public_id
    };
  });
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

// Get optimized URL for images
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
  };

  return cloudinary.url(publicId, { ...defaultOptions, ...options });
};

// Generate thumbnail for videos
export const generateVideoThumbnail = (publicId) => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    start_offset: '0',
    duration: '1',
    format: 'jpg',
    transformation: [
      { quality: 'auto' },
      { width: 300, height: 200, crop: 'fill' }
    ],
  });
};

export default {
  uploadAvatar,
  uploadAttachment,
  handleUploadError,
  validateFileSize,
  processAttachments,
  deleteFromCloudinary,
  getOptimizedImageUrl,
  generateVideoThumbnail,
  cloudinary,
};