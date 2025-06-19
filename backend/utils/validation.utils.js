import validator from 'validator';

// Validation rules
export const VALIDATION_RULES = {
  username: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  password: {
    minLength: 6,
    maxLength: 128,
  },
  name: {
    minLength: 1,
    maxLength: 50,
  },
  bio: {
    maxLength: 500,
  },
  chatName: {
    minLength: 1,
    maxLength: 100,
  },
  chatDescription: {
    maxLength: 500,
  },
  messageContent: {
    maxLength: 1000,
  },
};

// Validation error messages
export const VALIDATION_MESSAGES = {
  required: (field) => `${field} is required`,
  email: 'Please provide a valid email address',
  username: {
    length: `Username must be between ${VALIDATION_RULES.username.minLength} and ${VALIDATION_RULES.username.maxLength} characters`,
    pattern: 'Username can only contain letters, numbers, and underscores',
  },
  password: {
    length: `Password must be at least ${VALIDATION_RULES.password.minLength} characters`,
  },
  name: {
    length: `Name must be between ${VALIDATION_RULES.name.minLength} and ${VALIDATION_RULES.name.maxLength} characters`,
  },
  bio: {
    length: `Bio must be less than ${VALIDATION_RULES.bio.maxLength} characters`,
  },
  chatName: {
    length: `Chat name must be between ${VALIDATION_RULES.chatName.minLength} and ${VALIDATION_RULES.chatName.maxLength} characters`,
  },
  chatDescription: {
    length: `Description must be less than ${VALIDATION_RULES.chatDescription.maxLength} characters`,
  },
  messageContent: {
    length: `Message content must be less than ${VALIDATION_RULES.messageContent.maxLength} characters`,
  },
  url: 'Please provide a valid URL',
};

// Validation helper functions
export const isValidEmail = (email) => {
  return validator.isEmail(email);
};

export const isValidUsername = (username) => {
  if (typeof username !== 'string') return false;
  
  const { minLength, maxLength, pattern } = VALIDATION_RULES.username;
  
  return (
    username.length >= minLength &&
    username.length <= maxLength &&
    pattern.test(username)
  );
};

export const isValidPassword = (password) => {
  if (typeof password !== 'string') return false;
  
  const { minLength, maxLength } = VALIDATION_RULES.password;
  
  return password.length >= minLength && password.length <= maxLength;
};

export const isValidName = (name) => {
  if (typeof name !== 'string') return false;
  
  const trimmedName = name.trim();
  const { minLength, maxLength } = VALIDATION_RULES.name;
  
  return trimmedName.length >= minLength && trimmedName.length <= maxLength;
};

export const isValidBio = (bio) => {
  if (typeof bio !== 'string') return false;
  
  return bio.length <= VALIDATION_RULES.bio.maxLength;
};

export const isValidChatName = (chatName) => {
  if (typeof chatName !== 'string') return false;
  
  const trimmedName = chatName.trim();
  const { minLength, maxLength } = VALIDATION_RULES.chatName;
  
  return trimmedName.length >= minLength && trimmedName.length <= maxLength;
};

export const isValidChatDescription = (description) => {
  if (typeof description !== 'string') return false;
  
  return description.length <= VALIDATION_RULES.chatDescription.maxLength;
};

export const isValidMessageContent = (content) => {
  if (typeof content !== 'string') return false;
  
  return content.length <= VALIDATION_RULES.messageContent.maxLength;
};

export const isValidUrl = (url) => {
  if (typeof url !== 'string') return false;
  
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true,
  });
};

export const isValidObjectId = (id) => {
  return validator.isMongoId(id);
};

// Sanitization functions
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return validator.escape(str.trim());
};

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;
  
  return validator.normalizeEmail(email, {
    lowercase: true,
    remove_dots: false,
    remove_extension: false,
  });
};

// Complex validation functions
export const validateRegistrationData = (data) => {
  const errors = [];
  const { username, email, password, firstName, lastName } = data;

  // Required fields
  if (!username) errors.push(VALIDATION_MESSAGES.required('Username'));
  if (!email) errors.push(VALIDATION_MESSAGES.required('Email'));
  if (!password) errors.push(VALIDATION_MESSAGES.required('Password'));
  if (!firstName) errors.push(VALIDATION_MESSAGES.required('First name'));
  if (!lastName) errors.push(VALIDATION_MESSAGES.required('Last name'));

  // Username validation
  if (username && !isValidUsername(username)) {
    if (!VALIDATION_RULES.username.pattern.test(username)) {
      errors.push(VALIDATION_MESSAGES.username.pattern);
    } else {
      errors.push(VALIDATION_MESSAGES.username.length);
    }
  }

  // Email validation
  if (email && !isValidEmail(email)) {
    errors.push(VALIDATION_MESSAGES.email);
  }

  // Password validation
  if (password && !isValidPassword(password)) {
    errors.push(VALIDATION_MESSAGES.password.length);
  }

  // Name validation
  if (firstName && !isValidName(firstName)) {
    errors.push(VALIDATION_MESSAGES.name.length.replace('Name', 'First name'));
  }

  if (lastName && !isValidName(lastName)) {
    errors.push(VALIDATION_MESSAGES.name.length.replace('Name', 'Last name'));
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateLoginData = (data) => {
  const errors = [];
  const { identifier, password } = data;

  // Required fields
  if (!identifier) errors.push(VALIDATION_MESSAGES.required('Email or username'));
  if (!password) errors.push(VALIDATION_MESSAGES.required('Password'));

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateProfileData = (data) => {
  const errors = [];
  const { firstName, lastName, bio, avatar } = data;

  // Optional field validation
  if (firstName && !isValidName(firstName)) {
    errors.push(VALIDATION_MESSAGES.name.length.replace('Name', 'First name'));
  }

  if (lastName && !isValidName(lastName)) {
    errors.push(VALIDATION_MESSAGES.name.length.replace('Name', 'Last name'));
  }

  if (bio && !isValidBio(bio)) {
    errors.push(VALIDATION_MESSAGES.bio.length);
  }

  if (avatar && avatar.trim() && !isValidUrl(avatar)) {
    errors.push(VALIDATION_MESSAGES.url);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateGroupChatData = (data) => {
  const errors = [];
  const { chatName, description, participantIds } = data;

  // Required fields
  if (!chatName) {
    errors.push(VALIDATION_MESSAGES.required('Chat name'));
  } else if (!isValidChatName(chatName)) {
    errors.push(VALIDATION_MESSAGES.chatName.length);
  }

  // Optional field validation
  if (description && !isValidChatDescription(description)) {
    errors.push(VALIDATION_MESSAGES.chatDescription.length);
  }

  // Participants validation
  if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
    errors.push(VALIDATION_MESSAGES.required('Participants'));
  } else {
    // Validate each participant ID
    participantIds.forEach((id, index) => {
      if (!isValidObjectId(id)) {
        errors.push(`Invalid participant ID at position ${index + 1}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateMessageData = (data) => {
  const errors = [];
  const { content, attachments, replyTo } = data;

  // Either content or attachments must be provided
  if (!content && (!attachments || attachments.length === 0)) {
    errors.push('Message content or attachments are required');
  }

  // Content validation
  if (content && !isValidMessageContent(content)) {
    errors.push(VALIDATION_MESSAGES.messageContent.length);
  }

  // Reply validation
  if (replyTo && !isValidObjectId(replyTo)) {
    errors.push('Invalid reply message ID');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Pagination validation
export const validatePagination = (page, limit, maxLimit = 100) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 20, maxLimit);

  return {
    page: Math.max(pageNum, 1),
    limit: Math.max(limitNum, 1),
  };
};

// Search term validation
export const validateSearchTerm = (searchTerm, minLength = 2) => {
  if (typeof searchTerm !== 'string') return false;
  
  const trimmed = searchTerm.trim();
  return trimmed.length >= minLength;
};

export default {
  VALIDATION_RULES,
  VALIDATION_MESSAGES,
  isValidEmail,
  isValidUsername,
  isValidPassword,
  isValidName,
  isValidBio,
  isValidChatName,
  isValidChatDescription,
  isValidMessageContent,
  isValidUrl,
  isValidObjectId,
  sanitizeString,
  sanitizeEmail,
  validateRegistrationData,
  validateLoginData,
  validateProfileData,
  validateGroupChatData,
  validateMessageData,
  validatePagination,
  validateSearchTerm,
};