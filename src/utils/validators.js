/**
 * Validation utilities for API requests
 * Follows the API specification and ensures proper data validation
 */

const validators = {
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email);
  },

  /**
   * Validate password (minimum 6 characters)
   * @param {string} password - Password to validate
   * @returns {boolean}
   */
  isValidPassword: (password) => {
    return typeof password === 'string' && password.length >= 6;
  },

  /**
   * Validate job creation request
   * @param {object} jobData - Job data to validate
   * @returns {object} - { isValid: boolean, errors: array }
   */
  validateJobCreate: (jobData) => {
    const errors = [];
    const requiredFields = [
      'positionName',
      'company',
      'salary',
      'location',
      'qualification',
      'companyOverview'
    ];

    // Check required fields
    requiredFields.forEach((field) => {
      if (!jobData[field] || (typeof jobData[field] === 'string' && jobData[field].trim() === '')) {
        errors.push(`${field} is required`);
      }
    });

    // Validate string fields are not empty
    const stringFields = ['positionName', 'company', 'salary', 'location', 'qualification', 'companyOverview'];
    stringFields.forEach((field) => {
      if (jobData[field] && typeof jobData[field] !== 'string') {
        errors.push(`${field} must be a string`);
      }
    });

    // Validate applicationDeadline if provided (ISO 8601)
    if (jobData.applicationDeadline) {
      const date = new Date(jobData.applicationDeadline);
      if (isNaN(date.getTime())) {
        errors.push('applicationDeadline must be a valid ISO 8601 date string');
      }
    }

    // Validate responsibilities format
    if (jobData.responsibilities) {
      if (Array.isArray(jobData.responsibilities)) {
        if (!jobData.responsibilities.every((r) => typeof r === 'string')) {
          errors.push('responsibilities must be an array of strings or CSV string');
        }
      } else if (typeof jobData.responsibilities !== 'string') {
        errors.push('responsibilities must be an array or CSV string');
      }
    }

    // Validate skills format
    if (jobData.skills) {
      if (Array.isArray(jobData.skills)) {
        if (!jobData.skills.every((s) => typeof s === 'string')) {
          errors.push('skills must be an array of strings or CSV string');
        }
      } else if (typeof jobData.skills !== 'string') {
        errors.push('skills must be an array or CSV string');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate job update request
   * @param {object} jobData - Job data to validate (partial)
   * @returns {object} - { isValid: boolean, errors: array }
   */
  validateJobUpdate: (jobData) => {
    const errors = [];

    // Validate applicationDeadline if provided
    if (jobData.applicationDeadline) {
      const date = new Date(jobData.applicationDeadline);
      if (isNaN(date.getTime())) {
        errors.push('applicationDeadline must be a valid ISO 8601 date string');
      }
    }

    // Validate responsibilities format
    if (jobData.responsibilities) {
      if (Array.isArray(jobData.responsibilities)) {
        if (!jobData.responsibilities.every((r) => typeof r === 'string')) {
          errors.push('responsibilities must be an array of strings or CSV string');
        }
      } else if (typeof jobData.responsibilities !== 'string') {
        errors.push('responsibilities must be an array or CSV string');
      }
    }

    // Validate skills format
    if (jobData.skills) {
      if (Array.isArray(jobData.skills)) {
        if (!jobData.skills.every((s) => typeof s === 'string')) {
          errors.push('skills must be an array of strings or CSV string');
        }
      } else if (typeof jobData.skills !== 'string') {
        errors.push('skills must be an array or CSV string');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate file upload
   * @param {File} file - File to validate
   * @param {string} type - Expected MIME type pattern (e.g., 'image/*')
   * @param {number} maxSizeBytes - Maximum file size in bytes (default 10MB)
   * @returns {object} - { isValid: boolean, error: string }
   */
  validateFile: (file, type = 'image/*', maxSizeBytes = 10 * 1024 * 1024) => {
    if (!file) {
      return { isValid: false, error: 'File is required' };
    }

    if (!file.type.match(type.replace('*', '.*'))) {
      return { isValid: false, error: `File must be of type ${type}` };
    }

    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(maxSizeBytes / (1024 * 1024))} MB`,
      };
    }

    return { isValid: true, error: null };
  },

  /**
   * Validate department creation
   * @param {object} departmentData - Department data
   * @returns {object} - { isValid: boolean, errors: array }
   */
  validateDepartment: (departmentData) => {
    const errors = [];

    if (!departmentData.name || (typeof departmentData.name === 'string' && departmentData.name.trim() === '')) {
      errors.push('Department name is required');
    }

    if (departmentData.name && typeof departmentData.name !== 'string') {
      errors.push('Department name must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate news article creation
   * @param {object} newsData - News data
   * @returns {object} - { isValid: boolean, errors: array }
   */
  validateNews: (newsData) => {
    const errors = [];
    const requiredFields = ['title', 'content', 'author'];

    requiredFields.forEach((field) => {
      if (!newsData[field] || (typeof newsData[field] === 'string' && newsData[field].trim() === '')) {
        errors.push(`${field} is required`);
      }
    });

    // Validate string fields
    const stringFields = ['title', 'content', 'author'];
    stringFields.forEach((field) => {
      if (newsData[field] && typeof newsData[field] !== 'string') {
        errors.push(`${field} must be a string`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate login credentials
   * @param {object} credentials - Login credentials
   * @returns {object} - { isValid: boolean, errors: array }
   */
  validateLogin: (credentials) => {
    const errors = [];

    if (!credentials.email) {
      errors.push('Email is required');
    } else if (!validators.isValidEmail(credentials.email)) {
      errors.push('Email format is invalid');
    }

    if (!credentials.password) {
      errors.push('Password is required');
    } else if (!validators.isValidPassword(credentials.password)) {
      errors.push('Password must be at least 6 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Format CSV string to array
   * @param {string|array} data - CSV string or array
   * @returns {array}
   */
  formatAsArray: (data) => {
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data === 'string') {
      return data.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
    }
    return [];
  },

  /**
   * Convert FormData array fields to proper format
   * @param {FormData} formData - Form data object
   * @param {string} fieldName - Field name with array notation (e.g., 'skills[]')
   * @returns {array}
   */
  getFormDataArray: (formData, fieldName) => {
    return formData.getAll(fieldName) || [];
  }
};

export default validators;
