// Standard response structure
export const createResponse = (status, message, data = null, errors = null) => {
    const response = {
      status,
      message,
      timestamp: new Date().toISOString(),
    };
  
    if (data !== null) {
      response.data = data;
    }
  
    if (errors !== null) {
      response.errors = errors;
    }
  
    return response;
  };
  
  // Success responses
  export const successResponse = (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json(createResponse('success', message, data));
  };
  
  export const createdResponse = (res, message, data = null) => {
    return res.status(201).json(createResponse('success', message, data));
  };
  
  // Error responses
  export const errorResponse = (res, message, statusCode = 500, errors = null) => {
    return res.status(statusCode).json(createResponse('error', message, null, errors));
  };
  
  export const badRequestResponse = (res, message, errors = null) => {
    return res.status(400).json(createResponse('error', message, null, errors));
  };
  
  export const unauthorizedResponse = (res, message = 'Unauthorized') => {
    return res.status(401).json(createResponse('error', message));
  };
  
  export const forbiddenResponse = (res, message = 'Forbidden') => {
    return res.status(403).json(createResponse('error', message));
  };
  
  export const notFoundResponse = (res, message = 'Resource not found') => {
    return res.status(404).json(createResponse('error', message));
  };
  
  export const conflictResponse = (res, message = 'Resource already exists') => {
    return res.status(409).json(createResponse('error', message));
  };
  
  export const validationErrorResponse = (res, errors) => {
    return res.status(400).json(createResponse('error', 'Validation failed', null, errors));
  };
  
  export const internalServerErrorResponse = (res, message = 'Internal server error') => {
    return res.status(500).json(createResponse('error', message));
  };
  
  // Paginated response
  export const paginatedResponse = (res, message, data, pagination, statusCode = 200) => {
    const responseData = {
      ...data,
      pagination,
    };
    
    return res.status(statusCode).json(createResponse('success', message, responseData));
  };
  
  // Helper function to create pagination object
  export const createPagination = (page, limit, total, hasNext = null, hasPrev = null) => {
    const totalPages = Math.ceil(total / limit);
    
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNext: hasNext !== null ? hasNext : page < totalPages,
      hasPrev: hasPrev !== null ? hasPrev : page > 1,
    };
  };
  
  // Response middleware for consistent error handling
  export const responseMiddleware = (req, res, next) => {
    // Add response helpers to res object
    res.success = (message, data, statusCode) => successResponse(res, message, data, statusCode);
    res.created = (message, data) => createdResponse(res, message, data);
    res.error = (message, statusCode, errors) => errorResponse(res, message, statusCode, errors);
    res.badRequest = (message, errors) => badRequestResponse(res, message, errors);
    res.unauthorized = (message) => unauthorizedResponse(res, message);
    res.forbidden = (message) => forbiddenResponse(res, message);
    res.notFound = (message) => notFoundResponse(res, message);
    res.conflict = (message) => conflictResponse(res, message);
    res.validationError = (errors) => validationErrorResponse(res, errors);
    res.internalError = (message) => internalServerErrorResponse(res, message);
    res.paginated = (message, data, pagination, statusCode) => 
      paginatedResponse(res, message, data, pagination, statusCode);
  
    next();
  };
  
  export default {
    createResponse,
    successResponse,
    createdResponse,
    errorResponse,
    badRequestResponse,
    unauthorizedResponse,
    forbiddenResponse,
    notFoundResponse,
    conflictResponse,
    validationErrorResponse,
    internalServerErrorResponse,
    paginatedResponse,
    createPagination,
    responseMiddleware,
  };